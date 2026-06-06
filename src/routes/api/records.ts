import { Hono } from "hono";
import { getDB, initDB } from "~/server/db";
import { generateId, writeAuditLog, checkBlacklist, checkTimeoutVehicles } from "~/server/utils";

initDB();

const app = new Hono();

app.get("/", async (c) => {
  const db = getDB();
  const { status, plate, building } = c.req.query();

  let query = `
    SELECT pr.*, v.name, v.building, v.host_name, v.end_time as visitor_end_time
    FROM parking_records pr
    JOIN visitors v ON pr.visitor_id = v.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += " AND pr.status = ?";
    params.push(status);
  }
  if (plate) {
    query += " AND pr.plate_number LIKE ?";
    params.push(`%${plate}%`);
  }
  if (building) {
    query += " AND v.building LIKE ?";
    params.push(`%${building}%`);
  }

  query += " ORDER BY pr.entry_time DESC";

  const records = db.prepare(query).all(...params);
  return c.json(records);
});

app.get("/active", async (c) => {
  const db = getDB();
  checkTimeoutVehicles();

  const records = db.prepare(`
    SELECT pr.*, v.name, v.building, v.host_name, v.host_phone, v.end_time as visitor_end_time
    FROM parking_records pr
    JOIN visitors v ON pr.visitor_id = v.id
    WHERE pr.status IN ('parked', 'timeout')
    ORDER BY pr.entry_time DESC
  `).all();

  return c.json(records);
});

app.get("/timeout", async (c) => {
  const db = getDB();
  checkTimeoutVehicles();

  const records = db.prepare(`
    SELECT pr.*, v.name, v.phone, v.building, v.host_name, v.host_phone, v.end_time as visitor_end_time
    FROM parking_records pr
    JOIN visitors v ON pr.visitor_id = v.id
    WHERE pr.status = 'timeout'
    ORDER BY pr.entry_time DESC
  `).all();

  return c.json(records);
});

app.post("/entry", async (c) => {
  const db = getDB();
  const body = await c.req.json();
  const now = Date.now();

  const { qrCode, plateNumber, guardName, isManual = false, remark = "", isOffline = false } = body;

  const blacklistCheck = checkBlacklist(plateNumber);
  if (blacklistCheck.blocked) {
    writeAuditLog(
      "blacklist_block",
      "parking_record",
      "entry_attempt",
      guardName || "system",
      "guard",
      null,
      { plateNumber, reason: blacklistCheck.reason },
      `黑名单车辆入场被拦截：${blacklistCheck.reason}`
    );
    return c.json({ error: `车辆在黑名单中：${blacklistCheck.reason}` }, 403);
  }

  let visitor: any = null;

  if (qrCode) {
    visitor = db
      .prepare(
        "SELECT * FROM visitors WHERE qr_code = ? AND status = 'active' AND start_time <= ? AND end_time >= ?"
      )
      .get(qrCode, now, now);

    if (!visitor) {
      return c.json({ error: "二维码无效或已过期" }, 400);
    }

    if (plateNumber && visitor.plate_number !== plateNumber.toUpperCase()) {
      return c.json({ error: "车牌与预约信息不符" }, 400);
    }
  } else if (isManual && plateNumber) {
    visitor = db
      .prepare(
        "SELECT * FROM visitors WHERE plate_number = ? AND status = 'active' AND start_time <= ? AND end_time >= ?"
      )
      .get(plateNumber.toUpperCase(), now, now);

    if (!visitor) {
      return c.json({ error: "未找到有效的访客预约" }, 404);
    }
  } else {
    return c.json({ error: "请提供二维码或车牌信息" }, 400);
  }

  const existingRecord = db
    .prepare("SELECT * FROM parking_records WHERE visitor_id = ? AND status IN ('pending', 'parked', 'timeout')")
    .get(visitor.id);

  if (existingRecord) {
    return c.json({ error: "该访客车辆已在场内", record: existingRecord }, 400);
  }

  const id = generateId();
  const stmt = db.prepare(`
    INSERT INTO parking_records (id, visitor_id, plate_number, entry_time, entry_guard, entry_remark, is_manual_entry, is_offline_entry, synced, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'parked')
  `);

  stmt.run(
    id,
    visitor.id,
    visitor.plate_number,
    now,
    guardName || null,
    isManual ? remark : null,
    isManual ? 1 : 0,
    isOffline ? 1 : 0,
    isOffline ? 0 : 1,
  );

  writeAuditLog(
    "entry",
    "parking_record",
    id,
    guardName || "system",
    "guard",
    null,
    { plateNumber: visitor.plate_number, visitor: visitor.name, building: visitor.building },
    isManual ? `人工放行：${remark}` : "扫码入场"
  );

  const record = db.prepare("SELECT * FROM parking_records WHERE id = ?").get(id);
  return c.json(record, 201);
});

app.post("/exit", async (c) => {
  const db = getDB();
  const body = await c.req.json();
  const now = Date.now();

  const { qrCode, plateNumber, guardName, isManual = false, remark = "", isOffline = false } = body;

  let record: any = null;

  if (qrCode) {
    const visitor = db.prepare("SELECT * FROM visitors WHERE qr_code = ?").get(qrCode);
    if (!visitor) {
      return c.json({ error: "无效的二维码" }, 400);
    }

    record = db
      .prepare("SELECT * FROM parking_records WHERE visitor_id = ? AND status IN ('parked', 'timeout') ORDER BY entry_time DESC LIMIT 1")
      .get(visitor.id);
  } else if (plateNumber) {
    record = db
      .prepare("SELECT * FROM parking_records WHERE plate_number = ? AND status IN ('parked', 'timeout') ORDER BY entry_time DESC LIMIT 1")
      .get(plateNumber.toUpperCase());
  }

  if (!record) {
    return c.json({ error: "未找到在场的停车记录" }, 404);
  }

  const visitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(record.visitor_id);

  db.prepare(
    "UPDATE parking_records SET exit_time = ?, exit_guard = ?, exit_remark = ?, is_manual_exit = ?, is_offline_exit = ?, status = 'exited' WHERE id = ?"
  ).run(
    now,
    guardName || null,
    isManual ? remark : null,
    isManual ? 1 : 0,
    isOffline ? 1 : 0,
    record.id
  );

  db.prepare("UPDATE visitors SET status = 'used', updated_at = ? WHERE id = ?").run(now, record.visitor_id);

  writeAuditLog(
    "exit",
    "parking_record",
    record.id,
    guardName || "system",
    "guard",
    { status: record.status },
    { status: "exited" },
    isManual ? `人工放行离场：${remark}` : "扫码离场"
  );

  const updatedRecord = db.prepare("SELECT * FROM parking_records WHERE id = ?").get(record.id);
  return c.json(updatedRecord);
});

app.post("/sync", async (c) => {
  const db = getDB();
  const body = await c.req.json();
  const { records, guardName } = body;

  const results: any[] = [];

  for (const record of records) {
    try {
      if (record.type === "entry") {
        const existing = db.prepare("SELECT id FROM parking_records WHERE id = ?").get(record.id);
        if (!existing) {
          const stmt = db.prepare(`
            INSERT INTO parking_records (id, visitor_id, plate_number, entry_time, entry_guard, entry_remark, is_manual_entry, is_offline_entry, synced, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'parked')
          `);
          stmt.run(
            record.id,
            record.visitorId,
            record.plateNumber.toUpperCase(),
            record.entryTime,
            guardName || record.guardName,
            record.remark || null,
            record.isManual ? 1 : 0,
            1
          );
          results.push({ id: record.id, success: true, type: "entry" });
        }
      } else if (record.type === "exit") {
        db.prepare(
          "UPDATE parking_records SET exit_time = ?, exit_guard = ?, exit_remark = ?, is_manual_exit = ?, is_offline_exit = ?, synced = 1, status = 'exited' WHERE id = ?"
        ).run(
          record.exitTime,
          guardName || record.guardName,
          record.remark || null,
          record.isManual ? 1 : 0,
          1,
          record.id
        );
        results.push({ id: record.id, success: true, type: "exit" });
      }
    } catch (e: any) {
      results.push({ id: record.id, success: false, error: e.message });
    }
  }

  return c.json({ results, synced: results.filter(r => r.success).length });
});

export default app;
