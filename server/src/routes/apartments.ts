import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { apartments, priceHistory } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, adminMiddleware, AuthUser } from '../middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

const apartmentSchema = z.object({
  apartmentNo: z.string().min(1, '房源编号不能为空'),
  building: z.string().optional(),
  floor: z.number().optional(),
  area: z.number().optional(),
  layout: z.string().optional(),
  orientation: z.string().optional(),
  decoration: z.string().optional(),
  status: z.string().default('vacant'),
  monthlyRent: z.number().optional(),
  depositMonths: z.number().default(1),
  description: z.string().optional(),
  facilities: z.record(z.unknown()).optional(),
});

const priceUpdateSchema = z.object({
  monthlyRent: z.number().positive('租金必须大于0'),
  effectiveDate: z.string().min(1, '生效日期不能为空'),
  reason: z.string().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['vacant', 'occupied', 'reserved', 'maintenance', 'offline']),
  note: z.string().optional(),
});

app.get('/', async (c) => {
  const { page = '1', pageSize = '20', status, keyword, building, minRent, maxRent, layout } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  const conditions = [];
  if (status) conditions.push(eq(apartments.status, status));
  if (building) conditions.push(eq(apartments.building, building));
  if (layout) conditions.push(eq(apartments.layout, layout));
  if (minRent) conditions.push(sql`${apartments.monthlyRent} >= ${parseFloat(minRent)}`);
  if (maxRent) conditions.push(sql`${apartments.monthlyRent} <= ${parseFloat(maxRent)}`);
  if (keyword) {
    conditions.push(sql`${apartments.apartmentNo} ILIKE ${'%' + keyword + '%'} OR ${apartments.building} ILIKE ${'%' + keyword + '%'}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [list, count] = await Promise.all([
    db.select().from(apartments).where(where).orderBy(desc(apartments.updatedAt)).limit(parseInt(pageSize)).offset(offset),
    db.select({ count: sql`count(*)` }).from(apartments).where(where),
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
  const [apartment] = await db.select().from(apartments).where(eq(apartments.id, id));
  if (!apartment) {
    return c.json({ error: '房源不存在' }, 404);
  }
  const history = await db.select().from(priceHistory).where(eq(priceHistory.apartmentId, id)).orderBy(desc(priceHistory.effectiveDate));
  return c.json({ ...apartment, priceHistory: history });
});

app.post('/', adminMiddleware, zValidator('json', apartmentSchema), async (c) => {
  const data = c.req.valid('json');
  const [apartment] = await db.insert(apartments).values(data).returning();
  return c.json(apartment);
});

app.put('/:id', adminMiddleware, zValidator('json', apartmentSchema.partial()), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const [apartment] = await db.update(apartments).set({ ...data, updatedAt: new Date() }).where(eq(apartments.id, id)).returning();
  if (!apartment) {
    return c.json({ error: '房源不存在' }, 404);
  }
  return c.json(apartment);
});

app.patch('/:id/status', adminMiddleware, zValidator('json', statusUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const { status } = c.req.valid('json');
  const [apartment] = await db.update(apartments).set({ status, updatedAt: new Date() }).where(eq(apartments.id, id)).returning();
  if (!apartment) {
    return c.json({ error: '房源不存在' }, 404);
  }
  return c.json(apartment);
});

app.post('/:id/price', adminMiddleware, zValidator('json', priceUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  const data = c.req.valid('json');

  await db.transaction(async (tx) => {
    await tx.update(apartments).set({ monthlyRent: data.monthlyRent, updatedAt: new Date() }).where(eq(apartments.id, id));
    await tx.insert(priceHistory).values({
      apartmentId: id,
      monthlyRent: data.monthlyRent,
      effectiveDate: data.effectiveDate,
      reason: data.reason,
      operatorId: user.id,
    });
  });

  return c.json({ success: true });
});

app.delete('/:id', adminMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  await db.delete(apartments).where(eq(apartments.id, id));
  return c.json({ success: true });
});

export default app;
