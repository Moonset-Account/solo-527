import { getDB, initDB } from "~/server/db";

initDB();

export async function PUT() {
  const db = getDB();
  db.prepare("UPDATE notifications SET is_read = 1 WHERE is_read = 0").run();
  return Response.json({ success: true });
}
