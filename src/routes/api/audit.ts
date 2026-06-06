import { Hono } from "hono";
import { getDB, initDB } from "~/server/db";

initDB();

const app = new Hono();

app.get("/", async (c) => {
  const db = getDB();
  const { entityType, entityId, operator, action, startDate, endDate, page = 1, pageSize = 50 } = c.req.query();

  let query = "SELECT * FROM audit_logs WHERE 1=1";
  const params: any[] = [];

  if (entityType) {
    query += " AND entity_type = ?";
    params.push(entityType);
  }
  if (entityId) {
    query += " AND entity_id = ?";
    params.push(entityId);
  }
  if (operator) {
    query += " AND operator LIKE ?";
    params.push(`%${operator}%`);
  }
  if (action) {
    query += " AND action = ?";
    params.push(action);
  }
  if (startDate) {
    query += " AND created_at >= ?";
    params.push(parseInt(startDate as string));
  }
  if (endDate) {
    query += " AND created_at <= ?";
    params.push(parseInt(endDate as string));
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(pageSize as string), (parseInt(page as string) - 1) * parseInt(pageSize as string));

  const logs = db.prepare(query).all(...params);

  const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total").replace(" ORDER BY created_at DESC LIMIT ? OFFSET ?", "");
  const countParams = params.slice(0, -2);
  const total = (db.prepare(countQuery).get(...countParams) as any).total;

  return c.json({
    logs,
    pagination: {
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize as string)),
    },
  });
});

app.get("/report", async (c) => {
  const db = getDB();
  const { startDate, endDate } = c.req.query();
  const now = Date.now();
  const start = startDate ? parseInt(startDate as string) : now - 30 * 24 * 60 * 60 * 1000;
  const end = endDate ? parseInt(endDate as string) : now;

  const totalVisitors = (db
    .prepare("SELECT COUNT(*) as count FROM visitors WHERE created_at BETWEEN ? AND ?")
    .get(start, end) as any).count;

  const totalEntries = (db
    .prepare("SELECT COUNT(*) as count FROM parking_records WHERE entry_time BETWEEN ? AND ?")
    .get(start, end) as any).count;

  const timeoutCount = (db
    .prepare("SELECT COUNT(*) as count FROM parking_records WHERE status = 'timeout' AND entry_time BETWEEN ? AND ?")
    .get(start, end) as any).count;

  const manualEntries = (db
    .prepare("SELECT COUNT(*) as count FROM parking_records WHERE is_manual_entry = 1 AND entry_time BETWEEN ? AND ?")
    .get(start, end) as any).count;

  const offlineEntries = (db
    .prepare("SELECT COUNT(*) as count FROM parking_records WHERE is_offline_entry = 1 AND entry_time BETWEEN ? AND ?")
    .get(start, end) as any).count;

  const blacklistBlocks = (db
    .prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action = 'blacklist_block' AND created_at BETWEEN ? AND ?")
    .get(start, end) as any).count;

  const operatorStats = db
    .prepare(`
      SELECT operator, operator_role, COUNT(*) as count
      FROM audit_logs
      WHERE created_at BETWEEN ? AND ?
      GROUP BY operator, operator_role
      ORDER BY count DESC
    `)
    .all(start, end);

  const actionStats = db
    .prepare(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE created_at BETWEEN ? AND ?
      GROUP BY action
      ORDER BY count DESC
    `)
    .all(start, end);

  const buildingStats = db
    .prepare(`
      SELECT v.building, COUNT(*) as count
      FROM parking_records pr
      JOIN visitors v ON pr.visitor_id = v.id
      WHERE pr.entry_time BETWEEN ? AND ?
      GROUP BY v.building
      ORDER BY count DESC
    `)
    .all(start, end);

  return c.json({
    summary: {
      totalVisitors,
      totalEntries,
      timeoutCount,
      timeoutRate: totalEntries > 0 ? ((timeoutCount / totalEntries) * 100).toFixed(2) + "%" : "0%",
      manualEntries,
      offlineEntries,
      blacklistBlocks,
    },
    operatorStats,
    actionStats,
    buildingStats,
    period: { start, end },
  });
});

app.get("/export", async (c) => {
  const db = getDB();
  const { startDate, endDate, format = "json" } = c.req.query();
  const now = Date.now();
  const start = startDate ? parseInt(startDate as string) : now - 30 * 24 * 60 * 60 * 1000;
  const end = endDate ? parseInt(endDate as string) : now;

  const logs = db
    .prepare(
      "SELECT * FROM audit_logs WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC"
    )
    .all(start, end);

  if (format === "csv") {
    const headers = ["ID", "操作", "实体类型", "实体ID", "操作人", "角色", "备注", "时间"];
    const rows = logs.map((log: any) => [
      log.id,
      log.action,
      log.entity_type,
      log.entity_id,
      log.operator,
      log.operator_role,
      log.remark || "",
      new Date(log.created_at).toLocaleString("zh-CN"),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    return c.text(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${Date.now()}.csv"`,
    });
  }

  return c.json(logs);
});

export default app;
