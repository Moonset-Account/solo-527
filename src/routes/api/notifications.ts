import { getDB, initDB } from "~/server/db";
import { checkTimeoutVehicles } from "~/server/utils";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET(event: APIEvent) {
  const db = getDB();
  checkTimeoutVehicles();

  const url = new URL(event.request.url);
  const unread = url.searchParams.get("unread");
  const type = url.searchParams.get("type");

  let query = "SELECT * FROM notifications WHERE 1=1";
  const params: any[] = [];

  if (unread === "true") {
    query += " AND is_read = 0";
  }
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  query += " ORDER BY created_at DESC LIMIT 100";

  const notifications = db.prepare(query).all(...params);
  return Response.json(notifications);
}
