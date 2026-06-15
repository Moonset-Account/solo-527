import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { pets, vaccineAllergies } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { petSchema, petUpdateSchema, vaccineAllergySchema } from '../validations/schema';

export const petRoutes = new Hono();

petRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const status = c.req.query('status');
  const riskLevel = c.req.query('riskLevel');
  const search = c.req.query('search');

  let query = db.select().from(pets).$dynamic();

  if (status) {
    query = query.where(eq(pets.status, status));
  }
  if (riskLevel) {
    query = query.where(eq(pets.riskLevel, riskLevel));
  }
  if (search) {
    query = query.where(
      sql`${pets.name} ILIKE ${'%' + search + '%'} OR ${pets.ownerName} ILIKE ${'%' + search + '%'}`
    );
  }

  const [items, countResult] = await Promise.all([
    query.orderBy(desc(pets.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(pets),
  ]);

  return c.json({
    items,
    total: countResult[0].count,
    page,
    pageSize,
  });
});

petRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [pet, allergies] = await Promise.all([
    db.select().from(pets).where(eq(pets.id, id)).limit(1),
    db.select().from(vaccineAllergies).where(eq(vaccineAllergies.petId, id)),
  ]);

  if (!pet.length) {
    return c.json({ error: 'Pet not found' }, 404);
  }

  return c.json({
    ...pet[0],
    vaccineAllergies: allergies,
  });
});

petRoutes.post('/', zValidator('json', petSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db.insert(pets).values(data).returning();
  return c.json(result[0], 201);
});

petRoutes.put('/:id', zValidator('json', petUpdateSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const existing = await db.select().from(pets).where(eq(pets.id, id)).limit(1);
  if (!existing.length) {
    return c.json({ error: 'Pet not found' }, 404);
  }

  for (const [key, value] of Object.entries(data)) {
    if (existing[0][key as keyof typeof existing[0]] !== value) {
      await db.execute(sql`
        INSERT INTO revision_history (id, entity_type, entity_id, field_name, old_value, new_value, changed_by, created_at)
        VALUES (gen_random_uuid(), 'pet', ${id}, ${key}, ${existing[0][key as keyof typeof existing[0]]}::jsonb, ${value}::jsonb, 'system', now())
      `);
    }
  }

  const result = await db
    .update(pets)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(pets.id, id))
    .returning();

  return c.json(result[0]);
});

petRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(pets).where(eq(pets.id, id)).returning();
  if (!result.length) {
    return c.json({ error: 'Pet not found' }, 404);
  }
  return c.json({ message: 'Pet deleted successfully' });
});

petRoutes.get('/:id/vaccine-allergies', async (c) => {
  const petId = c.req.param('id');
  const result = await db
    .select()
    .from(vaccineAllergies)
    .where(eq(vaccineAllergies.petId, petId))
    .orderBy(desc(vaccineAllergies.createdAt));
  return c.json(result);
});

petRoutes.post('/:id/vaccine-allergies', zValidator('json', vaccineAllergySchema), async (c) => {
  const petId = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db.insert(vaccineAllergies).values({ ...data, petId }).returning();
  return c.json(result[0], 201);
});
