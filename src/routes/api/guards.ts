import { Hono } from "hono";
import { getDB, initDB } from "~/server/db";

initDB();

const app = new Hono();

app.get("/", async (c) => {
  const db = getDB();
  const guards = db.prepare("SELECT id, name, username, booth_number, created_at FROM guards ORDER BY name").all();
  return c.json(guards);
});

app.get("/:id", async (c) => {
  const db = getDB();
  const id = c.req.param("id");
  const guard = db.prepare("SELECT id, name, username, booth_number, created_at FROM guards WHERE id = ?").get(id);

  if (!guard) {
    return c.json({ error: "保安不存在" }, 404);
  }

  return c.json(guard);
});

export default app;
