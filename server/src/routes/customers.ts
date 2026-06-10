import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { customers, viewings, followUps } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, AuthUser } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

const customerSchema = z.object({
  name: z.string().min(1, '客户姓名不能为空'),
  phone: z.string().min(1, '手机号不能为空'),
  idCard: z.string().optional(),
  source: z.string().optional(),
  requirements: z.string().optional(),
  consultantId: z.number().optional(),
});

app.get('/', async (c) => {
  const { page = '1', pageSize = '20', keyword, consultantId, source } = c.req.query();
  const user = c.get('user') as AuthUser;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const conditions = [];
  if (user.role !== 'admin') {
    conditions.push(eq(customers.consultantId, user.id));
  }
  if (consultantId) conditions.push(eq(customers.consultantId, parseInt(consultantId)));
  if (source) conditions.push(eq(customers.source, source));
  if (keyword) {
    conditions.push(sql`${customers.name} ILIKE ${'%' + keyword + '%'} OR ${customers.phone} ILIKE ${'%' + keyword + '%'}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [list, count] = await Promise.all([
    db.select().from(customers).where(where).orderBy(desc(customers.createdAt)).limit(parseInt(pageSize)).offset(offset),
    db.select({ count: sql`count(*)` }).from(customers).where(where),
  ]);

  return c.json({
    list,
    total: parseInt(count[0].count as string),
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
});

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  if (!customer) {
    return c.json({ error: '客户不存在' }, 404);
  }
  const [customerViewings, customerFollowUps] = await Promise.all([
    db.select().from(viewings).where(eq(viewings.customerId, id)).orderBy(desc(viewings.viewingDate)),
    db.select().from(followUps).where(eq(followUps.customerId, id)).orderBy(desc(followUps.createdAt)),
  ]);
  return c.json({ ...customer, viewings: customerViewings, followUps: customerFollowUps });
});

app.post('/', zValidator('json', customerSchema), async (c) => {
  const user = c.get('user') as AuthUser;
  const data = c.req.valid('json');
  const [customer] = await db.insert(customers).values({
    ...data,
    consultantId: data.consultantId || user.id,
  }).returning();
  return c.json(customer);
});

app.put('/:id', zValidator('json', customerSchema.partial()), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const [customer] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
  if (!customer) {
    return c.json({ error: '客户不存在' }, 404);
  }
  return c.json(customer);
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  await db.delete(customers).where(eq(customers.id, id));
  return c.json({ success: true });
});

export default app;
