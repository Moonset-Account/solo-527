import { Hono } from "hono";
import { getDB, initDB } from "~/server/db";
import { generateId, writeAuditLog } from "~/server/utils";

initDB();

const app = new Hono();

app.get("/", async (c) => {
  const db = getDB();
  const { plate, active } = c.req.query();

  let query = "SELECT * FROM blacklist WHERE 1=1";
  const params: any[] = [];

  if (plate) {
    query += " AND plate_number LIKE ?";
    params.push(`%${plate}%`);
  }
  if (active !== undefined) {
    query += " AND is_active = ?";
    params.push(active === "true" ? 1 : 0);
  }

  query += " ORDER BY added_at DESC";

  const blacklist = db.prepare(query).all(...params);
  return c.json(blacklist);
});

app.post("/", async (c) => {
  const db = getDB();
  const body = await c.req.json();
  const now = Date.now();

  const { plateNumber, reason, addedBy, expiresAt } = body;

  if (!plateNumber || !reason || !addedBy) {
    return c.json({ error: "请提供车牌号、原因和添加人" }, 400);
  }

  const id = generateId();

  try {
    const stmt = db.prepare(`
      INSERT INTO blacklist (id, plate_number, reason, added_by, added_at, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(
      id,
      plateNumber.toUpperCase(),
      reason,
      addedBy,
      now,
      expiresAt || null
    );
  } catch (e: any) {
    if (e.message.includes("UNIQUE")) {
      return c.json({ error: "该车已在黑名单中" }, 409);
    }
    throw e;
  }

  writeAuditLog(
    "add",
    "blacklist",
    id,
    addedBy,
    "admin",
    null,
    { plateNumber, reason, expiresAt },
    "添加黑名单车辆"
  );

  return c.json({ id, plateNumber: plateNumber.toUpperCase() }, 201);
});

app.put("/:id", async (c) => {
  const db = getDB();
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = Date.now();

  const oldItem = db.prepare("SELECT * FROM blacklist WHERE id = ?").get(id);
  if (!oldItem) {
    return c.json({ error: "记录不存在" }, 404);
  }

  const { isActive, reason, expiresAt, operator = "system" } = body;

  db.prepare(`
    UPDATE blacklist SET
      reason = COALESCE(?, reason),
      expires_at = COALESCE(?, expires_at),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    reason || null,
    expiresAt || null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    id
  );

  const newItem = db.prepare("SELECT * FROM blacklist WHERE id = ?").get(id);

  writeAuditLog(
    "update",
    "blacklist",
    id,
    operator,
    "admin",
    oldItem,
    newItem,
    isActive === 0 ? "从黑名单移除" : "更新黑名单信息"
  );

  return c.json(newItem);
});

app.delete("/:id", async (c) => {
  const db = getDB();
  const id = c.req.param("id");
  const { operator = "system" } = await c.req.json();

  const oldItem = db.prepare("SELECT * FROM blacklist WHERE id = ?").get(id);
  if (!oldItem) {
    return c.json({ error: "记录不存在" }, 404);
  }

  db.prepare("DELETE FROM blacklist WHERE id = ?").run(id);

  writeAuditLog(
    "delete",
    "blacklist",
    id,
    operator,
    "admin",
    oldItem,
    null,
    "删除黑名单记录"
  );

  return c.json({ success: true });
});

app.get("/check/:plateNumber", async (c) => {
  const db = getDB();
  const plateNumber = c.req.param("plateNumber");
  const now = Date.now();

  const result = db
    .prepare(
      "SELECT * FROM blacklist WHERE plate_number = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > ?)"
    )
    .get(plateNumber.toUpperCase(), now);

  if (result) {
    return c.json({ blocked: true, item: result });
  }

  return c.json({ blocked: false });
});

export default app;
