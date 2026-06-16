import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const app = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
});

app.post('/login', async (c) => {
  const body = await c.req.json();
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { email } = result.data;

  const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userList[0];

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ user, token: `mock-token-${user.id}` });
});

app.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const userIdMatch = token.match(/mock-token-(\d+)/);

  if (!userIdMatch) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const userId = parseInt(userIdMatch[1], 10);
  const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userList[0];

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ user });
});

export default app;
