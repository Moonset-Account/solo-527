import { getDB, initDB } from "~/server/db";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function GET({ params }: APIEvent) {
  const db = getDB();
  const id = params.id;
  const guard = db.prepare("SELECT id, name, username, booth_number, created_at FROM guards WHERE id = ?").get(id);

  if (!guard) {
    return Response.json({ error: "保安不存在" }, { status: 404 });
  }

  return Response.json(guard);
}
