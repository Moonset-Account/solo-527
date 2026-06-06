import { getDB, initDB } from "~/server/db";
import { validatePlateNumber, writeAuditLog, checkBlacklist } from "~/server/utils";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET({ params }: APIEvent) {
  const db = getDB();
  const id = params.id;
  const visitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(id);

  if (!visitor) {
    return Response.json({ error: "访客不存在" }, { status: 404 });
  }

  return Response.json(visitor);
}

export async function PUT({ params, request }: APIEvent) {
  const db = getDB();
  const id = params.id;
  const body = await request.json();
  const now = Date.now();

  const oldVisitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(id);
  if (!oldVisitor) {
    return Response.json({ error: "访客不存在" }, { status: 404 });
  }

  const { status, operator = "system" } = body;

  if (body.plateNumber && !validatePlateNumber(body.plateNumber)) {
    return Response.json({ error: "车牌格式不正确" }, { status: 400 });
  }

  if (body.plateNumber) {
    const blacklistCheck = checkBlacklist(body.plateNumber);
    if (blacklistCheck.blocked) {
      return Response.json({ error: `车辆在黑名单中：${blacklistCheck.reason}` }, { status: 403 });
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

  return Response.json(newVisitor);
}
