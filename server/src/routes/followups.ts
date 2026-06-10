import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { followUps, customers, apartments } from '../db/schema';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { authMiddleware, AuthUser } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

const followUpSchema = z.object({
  customerId: z.number().min(1, '请选择客户'),
  apartmentId: z.number().optional(),
  type: z.enum(['phone', 'wechat', 'visit', 'other']),
  content: z.string().min(1, '请填写跟进内容'),
  nextFollowDate: z.string().optional(),
  result: z.enum(['interested', 'negotiating', 'signed', 'lost', 'pending']).optional(),
});

app.get('/', async (c) => {
  const { page = '1', pageSize = '20', consultantId, customerId, type, startDate, endDate, pending } = c.req.query();
  const user = c.get('user') as AuthUser;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const conditions = [];
  if (user.role !== 'admin') {
    conditions.push(eq(followUps.consultantId, user.id));
  }
  if (consultantId) conditions.push(eq(followUps.consultantId, parseInt(consultantId)));
  if (customerId) conditions.push(eq(followUps.customerId, parseInt(customerId)));
  if (type) conditions.push(eq(followUps.type, type));
  if (startDate) conditions.push(sql`${followUps.createdAt} >= ${startDate}`);
  if (endDate) conditions.push(sql`${followUps.createdAt} <= ${endDate}`);
  if (pending === 'true') {
    conditions.push(isNull(followUps.result));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db.select({
    id: followUps.id,
    type: followUps.type,
    content: followUps.content,
    result: followUps.result,
    nextFollowDate: followUps.nextFollowDate,
    createdAt: followUps.createdAt,
    customer: customers,
    apartment: apartments,
  }).from(followUps)
    .leftJoin(customers, eq(followUps.customerId, customers.id))
    .leftJoin(apartments, eq(followUps.apartmentId, apartments.id))
    .where(where)
    .orderBy(desc(followUps.createdAt))
    .limit(parseInt(pageSize))
    .offset(offset);

  const [count] = await db.select({ count: sql`count(*)` }).from(followUps).where(where);

  return c.json({
    list,
    total: parseInt(count.count as string),
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
});

app.post('/', zValidator('json', followUpSchema), async (c) => {
  const user = c.get('user') as AuthUser;
  const data = c.req.valid('json');
  const [followUp] = await db.insert(followUps).values({
    ...data,
    consultantId: user.id,
  }).returning();
  return c.json(followUp);
});

app.put('/:id', zValidator('json', followUpSchema.partial()), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const [followUp] = await db.update(followUps).set(data).where(eq(followUps.id, id)).returning();
  if (!followUp) {
    return c.json({ error: '跟进记录不存在' }, 404);
  }
  return c.json(followUp);
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  await db.delete(followUps).where(eq(followUps.id, id));
  return c.json({ success: true });
});

export default app;
