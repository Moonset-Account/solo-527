import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { healthRecords, photos, revisitPlans, pets, vaccineAllergies } from '../db/schema';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { healthRecordSchema, photoSchema } from '../validations/schema';

export const recordRoutes = new Hono();

recordRoutes.get('/overview', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');

  const query = db
    .select({
      pet: pets,
      latestRevisitPlan: sql`(
        SELECT json_build_object('id', rp.id, 'plan_date', rp.plan_date, 'plan_type', rp.plan_type, 'status', rp.status)
        FROM revisit_plans rp
        WHERE rp.pet_id = pets.id
        ORDER BY rp.plan_date DESC
        LIMIT 1
      )`.as('latest_revisit_plan'),
      latestWashPhoto: sql`(
        SELECT json_build_object('id', p.id, 'url', p.url, 'thumbnail', p.thumbnail, 'created_at', p.created_at)
        FROM photos p
        WHERE p.pet_id = pets.id AND p.photo_type = 'wash'
        ORDER BY p.created_at DESC
        LIMIT 1
      )`.as('latest_wash_photo'),
      vaccineAllergies: sql`(
        SELECT json_agg(json_build_object('id', va.id, 'type', va.type, 'name', va.name, 'reaction', va.reaction))
        FROM vaccine_allergies va
        WHERE va.pet_id = pets.id
      )`.as('vaccine_allergies'),
    })
    .from(pets)
    .leftJoin(revisitPlans, eq(revisitPlans.petId, pets.id))
    .leftJoin(photos, and(eq(photos.petId, pets.id), eq(photos.photoType, 'wash')))
    .groupBy(pets.id);

  const result = await query;

  const formatted = result.map((row) => ({
    ...row.pet,
    latestRevisitPlan: row.latestRevisitPlan,
    latestWashPhoto: row.latestWashPhoto,
    vaccineAllergies: row.vaccineAllergies || [],
  }));

  return c.json(formatted);
});

recordRoutes.get('/health', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const petId = c.req.query('petId');
  const recordType = c.req.query('recordType');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');

  let query = db.select().from(healthRecords).$dynamic();

  if (petId) {
    query = query.where(eq(healthRecords.petId, petId));
  }
  if (recordType) {
    query = query.where(eq(healthRecords.recordType, recordType));
  }
  if (startDate) {
    query = query.where(gte(healthRecords.recordedAt, startDate));
  }
  if (endDate) {
    query = query.where(lte(healthRecords.recordedAt, endDate + ' 23:59:59'));
  }

  const [items, countResult] = await Promise.all([
    query.orderBy(desc(healthRecords.recordedAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(healthRecords),
  ]);

  return c.json({
    items,
    total: countResult[0].count,
    page,
    pageSize,
  });
});

recordRoutes.post('/health', zValidator('json', healthRecordSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db.insert(healthRecords).values(data).returning();
  return c.json(result[0], 201);
});

recordRoutes.get('/health/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.select().from(healthRecords).where(eq(healthRecords.id, id)).limit(1);
  if (!result.length) {
    return c.json({ error: 'Health record not found' }, 404);
  }
  return c.json(result[0]);
});

recordRoutes.put('/health/:id', zValidator('json', healthRecordSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db.update(healthRecords).set(data).where(eq(healthRecords.id, id)).returning();
  if (!result.length) {
    return c.json({ error: 'Health record not found' }, 404);
  }
  return c.json(result[0]);
});

recordRoutes.delete('/health/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(healthRecords).where(eq(healthRecords.id, id)).returning();
  if (!result.length) {
    return c.json({ error: 'Health record not found' }, 404);
  }
  return c.json({ message: 'Health record deleted successfully' });
});

recordRoutes.get('/photos', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const petId = c.req.query('petId');
  const photoType = c.req.query('photoType');

  let query = db.select().from(photos).$dynamic();

  if (petId) {
    query = query.where(eq(photos.petId, petId));
  }
  if (photoType) {
    query = query.where(eq(photos.photoType, photoType));
  }

  const [items, countResult] = await Promise.all([
    query.orderBy(desc(photos.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(photos),
  ]);

  return c.json({
    items,
    total: countResult[0].count,
    page,
    pageSize,
  });
});

recordRoutes.post('/photos', zValidator('json', photoSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db.insert(photos).values(data).returning();
  return c.json(result[0], 201);
});

recordRoutes.delete('/photos/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(photos).where(eq(photos.id, id)).returning();
  if (!result.length) {
    return c.json({ error: 'Photo not found' }, 404);
  }
  return c.json({ message: 'Photo deleted successfully' });
});
