import { getDB, initDB } from "~/server/db";
import { generateId, writeAuditLog, checkBlacklist } from "~/server/utils";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function POST({ request }: APIEvent) {
  const db = getDB();
  const body = await request.json();
  const now = Date.now();

  const { qrCode, plateNumber, guardName, isManual = false, remark = "", isOffline = false } = body;

  if (!guardName || !guardName.trim()) {
    return Response.json({ error: "保安姓名不能为空" }, { status: 400 });
  }

  if (isManual && (!remark || !remark.trim())) {
    return Response.json({ error: "人工放行必须填写原因" }, { status: 400 });
  }

  let visitor: any = null;
  let actualPlateNumber = plateNumber || "";

  if (qrCode) {
    visitor = db
      .prepare(
        "SELECT * FROM visitors WHERE qr_code = ? AND status = 'active' AND start_time <= ? AND end_time >= ?"
      )
      .get(qrCode, now, now);

    if (!visitor) {
      return Response.json({ error: "二维码无效或已过期" }, { status: 400 });
    }

    actualPlateNumber = visitor.plate_number;

    if (plateNumber && visitor.plate_number !== plateNumber.toUpperCase()) {
      return Response.json({ error: "车牌与预约信息不符" }, { status: 400 });
    }
  } else if (isManual && plateNumber) {
    actualPlateNumber = plateNumber.toUpperCase();
    visitor = db
      .prepare(
        "SELECT * FROM visitors WHERE plate_number = ? AND status = 'active' AND start_time <= ? AND end_time >= ?"
      )
      .get(plateNumber.toUpperCase(), now, now);

    if (!visitor) {
      return Response.json({ error: "未找到有效的访客预约" }, { status: 404 });
    }
  } else {
    return Response.json({ error: "请提供二维码或车牌信息" }, { status: 400 });
  }

  const blacklistCheck = checkBlacklist(actualPlateNumber);
  if (blacklistCheck.blocked) {
    writeAuditLog(
      "blacklist_block",
      "parking_record",
      "entry_attempt",
      guardName || "system",
      "guard",
      null,
      { plateNumber: actualPlateNumber, visitor: visitor?.name, reason: blacklistCheck.reason },
      `黑名单车辆入场被拦截：${blacklistCheck.reason}`
    );
    return Response.json({ error: `车辆在黑名单中：${blacklistCheck.reason}` }, { status: 403 });
  }

  const existingRecord = db
    .prepare("SELECT * FROM parking_records WHERE visitor_id = ? AND status IN ('pending', 'parked', 'timeout')")
    .get(visitor.id);

  if (existingRecord) {
    return Response.json({ error: "该访客车辆已在场内", record: existingRecord }, { status: 400 });
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
  return Response.json(record, { status: 201 });
}
