import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, ilike, and, or, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { paginate, parsePagination } from '../lib/utils.js';

const usersRouter = new Hono();

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'operator', 'member']).default('member'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

const updateUserSchema = createUserSchema.partial();

usersRouter.get('/', async (c) => {
  const { page, pageSize } = parsePagination(c.req.query());
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.role) {
    conditions.push(eq(users.role, query.role as any));
  }
  if (query.keyword) {
    conditions.push(
      or(
        ilike(users.name, `%${query.keyword}%`),
        ilike(users.email, `%${query.keyword}%`),
      ),
    );
  }
  if (query.ids) {
    const ids = String(query.ids).split(',').filter(Boolean);
    if (ids.length > 0) {
      conditions.push(inArray(users.id, ids));
    }
  }
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const allUsers = await db.select().from(users).where(where).orderBy(desc(users.createdAt));
  return c.json(paginate(allUsers, page, pageSize));
});

usersRouter.get('/operators', async (c) => {
  const operators = await db
    .select()
    .from(users)
    .where(or(eq(users.role, 'admin'), eq(users.role, 'operator')))
    .orderBy(users.name);
  return c.json(operators);
});

usersRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = await db.select().from(users).where(eq(users.id, id));
  if (user.length === 0) {
    return c.json({ message: '用户不存在' }, 404);
  }
  return c.json(user[0]);
});

usersRouter.post('/', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json');
  try {
    const result = await db.insert(users).values(data).returning();
    return c.json(result[0], 201);
  } catch (e: any) {
    if (e?.code === '23505') {
      return c.json({ message: '邮箱已存在' }, 409);
    }
    throw e;
  }
});

usersRouter.put('/:id', zValidator('json', updateUserSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
  if (result.length === 0) {
    return c.json({ message: '用户不存在' }, 404);
  }
  return c.json(result[0]);
});

usersRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(users).where(eq(users.id, id)).returning();
  if (result.length === 0) {
    return c.json({ message: '用户不存在' }, 404);
  }
  return c.json({ deleted: true, item: result[0] });
});

export { usersRouter };
