import { getDB, initDB } from "~/server/db";
import { checkTimeoutVehicles } from "~/server/utils";

initDB();

export async function GET() {
  const db = getDB();
  checkTimeoutVehicles();

  const records = db.prepare(`
    SELECT pr.*, v.name, v.phone, v.building, v.host_name, v.host_phone, v.end_time as visitor_end_time
    FROM parking_records pr
    JOIN visitors v ON pr.visitor_id = v.id
    WHERE pr.status = 'timeout'
    ORDER BY pr.entry_time DESC
  `).all();

  return Response.json(records);
}
