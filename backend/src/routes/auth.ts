import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { generateToken, getCurrentUser, jwtAuthMiddleware } from '../middleware/auth';
import { ok, fail } from '../utils';

const app = new Hono();

app.post(
  '/login',
  zValidator(
    'json',
    z.object({
      username: z.string().min(1, '用户名不能为空'),
      password: z.string().min(1, '密码不能为空'),
    })
  ),
  async (c) => {
    const { username, password } = c.req.valid('json');
    const user = await db.query.users.findFirst({ where: eq(users.username, username) });
    if (!user) return fail(c, '用户名或密码错误', 401);
    if (!user.isActive) return fail(c, '账号已被禁用', 403);
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return fail(c, '用户名或密码错误', 401);
    const token = await generateToken(user);
    return ok(c, {
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        role: user.role,
        department: user.department,
        phone: user.phone,
        email: user.email,
      },
    });
  }
);

app.post('/logout', jwtAuthMiddleware(), (c) => {
  return ok(c, { message: '已退出登录' });
});

app.get('/me', jwtAuthMiddleware(), (c) => {
  const { user } = getCurrentUser(c);
  if (!user) return fail(c, '用户信息不存在', 404);
  return ok(c, {
    id: user.id,
    username: user.username,
    realName: user.realName,
    role: user.role,
    department: user.department,
    phone: user.phone,
    email: user.email,
  });
});

export default app;
