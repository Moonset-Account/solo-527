import { getDB, initDB } from "~/server/db";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function PUT({ params }: APIEvent) {
  const db = getDB();
  const id = params.id;

  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
  return Response.json({ success: true });
}
