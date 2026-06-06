import { getDB, initDB } from "~/server/db";
import { checkTimeoutVehicles } from "~/server/utils";

initDB();

export async function GET() {
  const db = getDB();
  checkTimeoutVehicles();

  const result = db
    .prepare("SELECT COUNT(*) as count FROM notifications WHERE is_read = 0")
    .get() as any;

  return Response.json({ count: result.count });
}
