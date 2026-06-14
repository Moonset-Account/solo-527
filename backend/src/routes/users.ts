import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { getCurrentUser, requireAdmin } from '../middleware/auth';
import { ok, fail, getPageParams } from '../utils';

const app = new Hono();

app.get('/', requireAdmin(), async (c) => {
  const query = c.req.query();
  const { page, pageSize, offset } = getPageParams(query);
  const role = query.role as 'admin' | 'equipment_supervisor' | 'planner' | undefined;

  const conditions = [];
  if (role) conditions.push(eq(schema.users.role, role));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [users, totalResult] = await Promise.all([
    db.query.users.findMany({
      where: whereClause,
      columns: { passwordHash: false },
      orderBy: desc(schema.users.createdAt),
      limit: pageSize,
      offset,
    }),
    db.select({ count: count() }).from(schema.users).where(whereClause),
  ]);

  return ok(c, users, { total: totalResult[0].count, page, pageSize });
});

app.get('/me', async (c) => {
  const userInfo = getCurrentUser(c);
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userInfo.sub),
    columns: { passwordHash: false },
  });
  return ok(c, user);
});

app.post(
  '/',
  requireAdmin(),
  zValidator(
    'json',
    z.object({
      username: z.string().min(3, '用户名至少3个字符').max(50),
      password: z.string().min(6, '密码至少6位'),
      realName: z.string().min(1, '真实姓名不能为空'),
      role: z.enum(['admin', 'equipment_supervisor', 'planner']),
      department: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
    })
  ),
  async (c) => {
    const payload = c.req.valid('json');
    const existing = await db.query.users.findFirst({ where: eq(schema.users.username, payload.username) });
    if (existing) return fail(c, '用户名已存在');
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const [inserted] = await db
      .insert(schema.users)
      .values({ ...payload, passwordHash, email: payload.email || undefined })
      .returning();
    const { passwordHash: _p, ...safe } = inserted;
    return ok(c, safe);
  }
);

app.put(
  '/:id',
  requireAdmin(),
  zValidator(
    'json',
    z.object({
      realName: z.string().min(1).optional(),
      role: z.enum(['admin', 'equipment_supervisor', 'planner']).optional(),
      department: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      isActive: z.boolean().optional(),
      password: z.string().min(6).optional(),
    })
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const payload = c.req.valid('json');
    const existing = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
    if (!existing) return fail(c, '用户不存在', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.realName !== undefined) updateData.realName = payload.realName;
    if (payload.role !== undefined) updateData.role = payload.role;
    if (payload.department !== undefined) updateData.department = payload.department;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;
    if (payload.password) updateData.passwordHash = await bcrypt.hash(payload.password, 10);

    await db.update(schema.users).set(updateData).where(eq(schema.users.id, id));
    const updated = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
      columns: { passwordHash: false },
    });
    return ok(c, updated);
  }
);

app.delete('/:id', requireAdmin(), async (c) => {
  const id = parseInt(c.req.param('id'));
  const currentUser = getCurrentUser(c);
  if (id === currentUser.sub) return fail(c, '不能删除当前登录用户');
  const existing = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
  if (!existing) return fail(c, '用户不存在', 404);
  await db.update(schema.users).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.users.id, id));
  return ok(c, { message: '用户已禁用', id });
});

export default app;
