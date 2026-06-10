import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { viewings, apartments, customers } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, AuthUser } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

const viewingSchema = z.object({
  apartmentId: z.number().min(1, '请选择房源'),
  customerId: z.number().min(1, '请选择客户'),
  viewingDate: z.string().min(1, '请选择看房时间'),
  note: z.string().optional(),
});

const viewingUpdateSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled', 'no_show']),
  feedback: z.string().optional(),
  note: z.string().optional(),
});

app.get('/', async (c) => {
  const { page = '1', pageSize = '20', status, consultantId, startDate, endDate, apartmentId, customerId } = c.req.query();
  const user = c.get('user') as AuthUser;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const conditions = [];
  if (user.role !== 'admin') {
    conditions.push(eq(viewings.consultantId, user.id));
  }
  if (consultantId) conditions.push(eq(viewings.consultantId, parseInt(consultantId)));
  if (status) conditions.push(eq(viewings.status, status));
  if (apartmentId) conditions.push(eq(viewings.apartmentId, parseInt(apartmentId)));
  if (customerId) conditions.push(eq(viewings.customerId, parseInt(customerId)));
  if (startDate) conditions.push(sql`${viewings.viewingDate} >= ${startDate}`);
  if (endDate) conditions.push(sql`${viewings.viewingDate} <= ${endDate}`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db.select({
    id: viewings.id,
    viewingDate: viewings.viewingDate,
    status: viewings.status,
    note: viewings.note,
    feedback: viewings.feedback,
    apartment: apartments,
    customer: customers,
  }).from(viewings)
    .leftJoin(apartments, eq(viewings.apartmentId, apartments.id))
    .leftJoin(customers, eq(viewings.customerId, customers.id))
    .where(where)
    .orderBy(desc(viewings.viewingDate))
    .limit(parseInt(pageSize))
    .offset(offset);

  const [count] = await db.select({ count: sql`count(*)` }).from(viewings).where(where);

  return c.json({
    list,
    total: parseInt(count.count as string),
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
});

app.post('/', zValidator('json', viewingSchema), async (c) => {
  const user = c.get('user') as AuthUser;
  const data = c.req.valid('json');
  const [viewing] = await db.insert(viewings).values({
    ...data,
    consultantId: user.id,
  }).returning();
  return c.json(viewing);
});

app.put('/:id', zValidator('json', viewingUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const [viewing] = await db.update(viewings).set(data).where(eq(viewings.id, id)).returning();
  if (!viewing) {
    return c.json({ error: '预约记录不存在' }, 404);
  }
  return c.json(viewing);
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  await db.delete(viewings).where(eq(viewings.id, id));
  return c.json({ success: true });
});

export default app;
