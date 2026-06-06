import { getDB, initDB } from "~/server/db";
import { checkTimeoutVehicles } from "~/server/utils";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET(event: APIEvent) {
  const db = getDB();
  const url = new URL(event.request.url);
  const status = url.searchParams.get("status");
  const plate = url.searchParams.get("plate");
  const building = url.searchParams.get("building");

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
  return Response.json(records);
}
