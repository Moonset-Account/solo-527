import { getDB, initDB } from "~/server/db";
import { writeAuditLog } from "~/server/utils";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function POST({ request }: APIEvent) {
  const db = getDB();
  const body = await request.json();
  const now = Date.now();

  const { qrCode, plateNumber, guardName, isManual = false, remark = "", isOffline = false } = body;

  let record: any = null;

  if (qrCode) {
    const visitor = db.prepare("SELECT * FROM visitors WHERE qr_code = ?").get(qrCode);
    if (!visitor) {
      return Response.json({ error: "无效的二维码" }, { status: 400 });
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
    return Response.json({ error: "未找到在场的停车记录" }, { status: 404 });
  }

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
  return Response.json(updatedRecord);
}
