import { getDB, initDB } from "~/server/db";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET(event: APIEvent) {
  const db = getDB();
  const url = new URL(event.request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const now = Date.now();
  const start = startDate ? parseInt(startDate) : now - 30 * 24 * 60 * 60 * 1000;
  const end = endDate ? parseInt(endDate) : now;

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

  return Response.json({
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
}
