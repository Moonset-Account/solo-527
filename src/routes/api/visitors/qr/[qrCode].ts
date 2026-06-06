import { getDB, initDB } from "~/server/db";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET({ params }: APIEvent) {
  const db = getDB();
  const qrCode = params.qrCode;
  const now = Date.now();

  const visitor = db
    .prepare(
      "SELECT * FROM visitors WHERE qr_code = ? AND status = 'active' AND start_time <= ? AND end_time >= ?"
    )
    .get(qrCode, now, now);

  if (!visitor) {
    return Response.json({ valid: false, message: "二维码无效或已过期" }, { status: 404 });
  }

  return Response.json({ valid: true, visitor });
}
