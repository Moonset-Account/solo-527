import { getDB, initDB } from "~/server/db";
import { generateId, generateQRCode, validatePlateNumber, writeAuditLog, checkBlacklist } from "~/server/utils";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET(event: APIEvent) {
  const db = getDB();
  const url = new URL(event.request.url);
  const status = url.searchParams.get("status");
  const plate = url.searchParams.get("plate");
  const building = url.searchParams.get("building");

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
  return Response.json(visitors);
}

export async function POST(event: APIEvent) {
  const db = getDB();
  const body = await event.request.json();
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
    return Response.json({ error: "车牌格式不正确" }, { status: 400 });
  }

  const blacklistCheck = checkBlacklist(plateNumber);
  if (blacklistCheck.blocked) {
    return Response.json({ error: `车辆在黑名单中：${blacklistCheck.reason}` }, { status: 403 });
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

  return Response.json({ id, qrCode }, { status: 201 });
}
