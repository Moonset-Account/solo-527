import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware, adminMiddleware, AuthUser } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

const userCreateSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符'),
  password: z.string().min(6, '密码至少6个字符'),
  name: z.string().min(1, '姓名不能为空'),
  role: z.enum(['consultant', 'admin']).default('consultant'),
  phone: z.string().optional(),
  email: z.string().email('邮箱格式不正确').optional(),
});

app.get('/', adminMiddleware, async (c) => {
  const list = await db.select({
    id: users.id,
    username: users.username,
    name: users.name,
    role: users.role,
    phone: users.phone,
    email: users.email,
    status: users.status,
    lastLogin: users.lastLogin,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  }).from(users).orderBy(desc(users.createdAt));
  
  return c.json(list);
});

app.post('/', adminMiddleware, zValidator('json', userCreateSchema), async (c) => {
  const { password, ...data } = c.req.valid('json');
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const [user] = await db.insert(users).values({
    ...data,
    password: hashedPassword,
  }).returning();
  
  const { password: _, ...result } = user;
  return c.json(result);
});

app.get('/me', async (c) => {
  const user = c.get('user') as AuthUser;
  const [fullUser] = await db.select().from(users).where(eq(users.id, user.id));
  const { password: _, ...result } = fullUser;
  return c.json(result);
});

app.put('/:id', adminMiddleware, zValidator('json', userCreateSchema.partial()), async (c) => {
  const id = parseInt(c.req.param('id'));
  const { password, ...data } = c.req.valid('json');
  
  const updateData: Partial<typeof users.$inferInsert> = { ...data };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }
  
  const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
  if (!user) {
    return c.json({ error: '用户不存在' }, 404);
  }
  
  const { password: _, ...result } = user;
  return c.json(result);
});

app.patch('/:id/status', adminMiddleware, zValidator('json', z.object({ status: z.enum(['active', 'inactive']) })), async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  const { status } = c.req.valid('json');
  
  if (id === user.id) {
    return c.json({ error: '不能禁用自己' }, 400);
  }
  
  const [updatedUser] = await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id)).returning();
  if (!updatedUser) {
    return c.json({ error: '用户不存在' }, 404);
  }
  
  const { password: _, ...result } = updatedUser;
  return c.json(result);
});

app.patch('/:id/password', adminMiddleware, zValidator('json', z.object({ password: z.string().min(6, '密码至少6个字符') })), async (c) => {
  const id = parseInt(c.req.param('id'));
  const { password } = c.req.valid('json');
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const [updatedUser] = await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, id)).returning();
  if (!updatedUser) {
    return c.json({ error: '用户不存在' }, 404);
  }
  
  return c.json({ success: true });
});

app.delete('/:id', adminMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  
  if (id === user.id) {
    return c.json({ error: '不能删除自己' }, 400);
  }
  
  await db.delete(users).where(eq(users.id, id));
  return c.json({ success: true });
});

export default app;
