import { Hono } from "hono";
import { getDB, initDB } from "~/server/db";
import { generateId, generateQRCode, validatePlateNumber, writeAuditLog, checkBlacklist } from "~/server/utils";

initDB();

const app = new Hono();

app.get("/", async (c) => {
  const db = getDB();
  const { status, plate, building } = c.req.query();

  let query = "SELECT * FROM visitors WHERE 1=1";
  const params: any[] = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (plate) {
    query += " AND plate_number LIKE ?";
    params.push(`%${plate}%`);
  }
  if (building) {
    query += " AND building LIKE ?";
    params.push(`%${building}%`);
  }

  query += " ORDER BY created_at DESC";

  const visitors = db.prepare(query).all(...params);
  return c.json(visitors);
});

app.get("/:id", async (c) => {
  const db = getDB();
  const id = c.req.param("id");
  const visitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(id);

  if (!visitor) {
    return c.json({ error: "访客不存在" }, 404);
  }

  return c.json(visitor);
});

app.get("/qr/:qrCode", async (c) => {
  const db = getDB();
  const qrCode = c.req.param("qrCode");
  const now = Date.now();

  const visitor = db
    .prepare(
      "SELECT * FROM visitors WHERE qr_code = ? AND status = 'active' AND start_time <= ? AND end_time >= ?"
    )
    .get(qrCode, now, now);

  if (!visitor) {
    return c.json({ valid: false, message: "二维码无效或已过期" }, 404);
  }

  return c.json({ valid: true, visitor });
});

app.post("/", async (c) => {
  const db = getDB();
  const body = await c.req.json();
  const now = Date.now();

  const {
    name,
    phone,
    plateNumber,
    building,
    hostName,
    hostPhone,
    startTime,
    endTime,
    meetingId,
    operator = "system",
  } = body;

  if (!validatePlateNumber(plateNumber)) {
    return c.json({ error: "车牌格式不正确" }, 400);
  }

  const blacklistCheck = checkBlacklist(plateNumber);
  if (blacklistCheck.blocked) {
    return c.json({ error: `车辆在黑名单中：${blacklistCheck.reason}` }, 403);
  }

  const id = generateId();
  const qrCode = generateQRCode();

  const stmt = db.prepare(`
    INSERT INTO visitors (id, name, phone, plate_number, building, host_name, host_phone, start_time, end_time, meeting_id, status, qr_code, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `);

  stmt.run(
    id,
    name,
    phone,
    plateNumber.toUpperCase(),
    building,
    hostName,
    hostPhone,
    startTime || now,
    endTime || now + 4 * 60 * 60 * 1000,
    meetingId || null,
    qrCode,
    now,
    now
  );

  writeAuditLog(
    "create",
    "visitor",
    id,
    operator,
    "host",
    null,
    { name, plateNumber, building },
    "创建访客记录"
  );

  return c.json({ id, qrCode }, 201);
});

app.put("/:id", async (c) => {
  const db = getDB();
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = Date.now();

  const oldVisitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(id);
  if (!oldVisitor) {
    return c.json({ error: "访客不存在" }, 404);
  }

  const { status, operator = "system" } = body;

  if (body.plateNumber && !validatePlateNumber(body.plateNumber)) {
    return c.json({ error: "车牌格式不正确" }, 400);
  }

  if (body.plateNumber) {
    const blacklistCheck = checkBlacklist(body.plateNumber);
    if (blacklistCheck.blocked) {
      return c.json({ error: `车辆在黑名单中：${blacklistCheck.reason}` }, 403);
    }
  }

  const stmt = db.prepare(`
    UPDATE visitors SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      plate_number = COALESCE(?, plate_number),
      building = COALESCE(?, building),
      host_name = COALESCE(?, host_name),
      host_phone = COALESCE(?, host_phone),
      start_time = COALESCE(?, start_time),
      end_time = COALESCE(?, end_time),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    body.name || null,
    body.phone || null,
    body.plateNumber?.toUpperCase() || null,
    body.building || null,
    body.hostName || null,
    body.hostPhone || null,
    body.startTime || null,
    body.endTime || null,
    status || null,
    now,
    id
  );

  const newVisitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(id);

  writeAuditLog(
    "update",
    "visitor",
    id,
    operator,
    "host",
    oldVisitor,
    newVisitor,
    status === "cancelled" ? "会议取消，访客权限失效" : "更新访客信息"
  );

  return c.json(newVisitor);
});

app.post("/:id/cancel", async (c) => {
  const db = getDB();
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = Date.now();

  const oldVisitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(id);
  if (!oldVisitor) {
    return c.json({ error: "访客不存在" }, 404);
  }

  db.prepare("UPDATE visitors SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now, id);

  writeAuditLog(
    "cancel",
    "visitor",
    id,
    body.operator || "system",
    "host",
    oldVisitor,
    { status: "cancelled" },
    "会议取消，访客权限自动失效"
  );

  return c.json({ success: true, message: "访客权限已失效" });
});

export default app;
