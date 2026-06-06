import { Hono } from "hono";
import { getDB, initDB } from "~/server/db";
import { checkTimeoutVehicles } from "~/server/utils";

initDB();

const app = new Hono();

app.get("/", async (c) => {
  const db = getDB();
  checkTimeoutVehicles();

  const { unread, type } = c.req.query();

  let query = "SELECT * FROM notifications WHERE 1=1";
  const params: any[] = [];

  if (unread === "true") {
    query += " AND is_read = 0";
    params.push();
  }
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  query += " ORDER BY created_at DESC LIMIT 100";

  const notifications = db.prepare(query).all(...params);
  return c.json(notifications);
});

app.put("/:id/read", async (c) => {
  const db = getDB();
  const id = c.req.param("id");

  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
  return c.json({ success: true });
});

app.put("/read-all", async (c) => {
  const db = getDB();
  db.prepare("UPDATE notifications SET is_read = 1 WHERE is_read = 0").run();
  return c.json({ success: true });
});

app.get("/unread-count", async (c) => {
  const db = getDB();
  checkTimeoutVehicles();

  const result = db
    .prepare("SELECT COUNT(*) as count FROM notifications WHERE is_read = 0")
    .get() as any;

  return c.json({ count: result.count });
});

export default app;
