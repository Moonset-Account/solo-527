import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateToken, authMiddleware, AuthUser } from '../middleware/auth';

const app = new Hono();

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const [user] = await db.select().from(users).where(eq(users.username, username));

  if (!user || !await bcrypt.compare(password, user.password)) {
    return c.json({ error: '用户名或密码错误' }, 401);
  }

  const token = generateToken(user.id);
  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
    },
  });
});

app.get('/me', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  return c.json(user);
});

export default app;
