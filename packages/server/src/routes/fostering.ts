import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { fosteringRecords, revisitPlans, photos } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { fosteringRecordSchema, revisitPlanSchema, photoSchema } from '../validations/schema';

export const fosteringRoutes = new Hono();

fosteringRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const status = c.req.query('status');
  const petId = c.req.query('petId');

  let query = db.select().from(fosteringRecords).$dynamic();

  if (status) {
    query = query.where(eq(fosteringRecords.status, status));
  }
  if (petId) {
    query = query.where(eq(fosteringRecords.petId, petId));
  }

  const [items, countResult] = await Promise.all([
    query.orderBy(desc(fosteringRecords.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(fosteringRecords),
  ]);

  return c.json({
    items,
    total: countResult[0].count,
    page,
    pageSize,
  });
});

fosteringRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.select().from(fosteringRecords).where(eq(fosteringRecords.id, id)).limit(1);
  if (!result.length) {
    return c.json({ error: 'Fostering record not found' }, 404);
  }
  return c.json(result[0]);
});

fosteringRoutes.post('/', zValidator('json', fosteringRecordSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db.insert(fosteringRecords).values(data).returning();
  return c.json(result[0], 201);
});

fosteringRoutes.put('/:id', zValidator('json', fosteringRecordSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .update(fosteringRecords)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(fosteringRecords.id, id))
    .returning();
  if (!result.length) {
    return c.json({ error: 'Fostering record not found' }, 404);
  }
  return c.json(result[0]);
});

fosteringRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(fosteringRecords).where(eq(fosteringRecords.id, id)).returning();
  if (!result.length) {
    return c.json({ error: 'Fostering record not found' }, 404);
  }
  return c.json({ message: 'Fostering record deleted successfully' });
});

fosteringRoutes.get('/:id/revisit-plans', async (c) => {
  const fosteringRecordId = c.req.param('id');
  const result = await db
    .select()
    .from(revisitPlans)
    .where(eq(revisitPlans.fosteringRecordId, fosteringRecordId))
    .orderBy(desc(revisitPlans.planDate));
  return c.json(result);
});

fosteringRoutes.post('/:id/revisit-plans', zValidator('json', revisitPlanSchema), async (c) => {
  const fosteringRecordId = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db.insert(revisitPlans).values({ ...data, fosteringRecordId }).returning();
  return c.json(result[0], 201);
});

fosteringRoutes.put('/revisit-plans/:id', zValidator('json', revisitPlanSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const updateData = data.status === 'completed' ? { ...data, completedAt: sql`now()` } : data;
  const result = await db
    .update(revisitPlans)
    .set(updateData)
    .where(eq(revisitPlans.id, id))
    .returning();
  if (!result.length) {
    return c.json({ error: 'Revisit plan not found' }, 404);
  }
  return c.json(result[0]);
});

fosteringRoutes.get('/:id/photos', async (c) => {
  const fosteringRecordId = c.req.param('id');
  const result = await db
    .select()
    .from(photos)
    .where(eq(photos.fosteringRecordId, fosteringRecordId))
    .orderBy(desc(photos.createdAt));
  return c.json(result);
});

fosteringRoutes.post('/:id/photos', zValidator('json', photoSchema), async (c) => {
  const fosteringRecordId = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db.insert(photos).values({ ...data, fosteringRecordId }).returning();
  return c.json(result[0], 201);
});
