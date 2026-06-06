import { getDB, initDB } from "~/server/db";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET() {
  const db = getDB();
  const guards = db.prepare("SELECT id, name, username, booth_number, created_at FROM guards ORDER BY name").all();
  return Response.json(guards);
}
