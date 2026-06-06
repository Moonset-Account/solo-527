import { getDB, initDB } from "~/server/db";
import { writeAuditLog } from "~/server/utils";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function POST({ params, request }: APIEvent) {
  const db = getDB();
  const id = params.id;
  const body = await request.json();
  const now = Date.now();

  const oldVisitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(id);
  if (!oldVisitor) {
    return Response.json({ error: "访客不存在" }, { status: 404 });
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

  return Response.json({ success: true, message: "访客权限已失效" });
}
