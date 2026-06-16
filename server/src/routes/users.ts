import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

const app = new Hono();

app.get('/', async (c) => {
  const userList = await db.select().from(users).orderBy(users.id);
  return c.json({ users: userList });
});

export default app;
