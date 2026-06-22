import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { savedFilters } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

export const filterRoutes = new Hono();

filterRoutes.use('*', authMiddleware);

const filterSchema = z.object({
  name: z.string().min(1).max(100),
  module: z.string().min(1).max(50),
  filters: z.record(z.any()),
  isDefault: z.boolean().optional(),
});

filterRoutes.get('/', async (c) => {
  const payload = c.get('jwtPayload');
  const module = c.req.query('module');

  const conditions = [eq(savedFilters.userId, payload.userId)];
  if (module) {
    conditions.push(eq(savedFilters.module, module));
  }

  const filters = await db
    .select()
    .from(savedFilters)
    .where(and(...conditions))
    .orderBy(desc(savedFilters.createdAt));

  return c.json(filters);
});

filterRoutes.post('/', zValidator('json', filterSchema), async (c) => {
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  if (data.isDefault) {
    await db
      .update(savedFilters)
      .set({ isDefault: false })
      .where(and(eq(savedFilters.userId, payload.userId), eq(savedFilters.module, data.module)));
  }

  const [newFilter] = await db
    .insert(savedFilters)
    .values({
      ...data,
      userId: payload.userId,
    })
    .returning();

  return c.json(newFilter, 201);
});

filterRoutes.put('/:id', zValidator('json', filterSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const payload = c.get('jwtPayload');

  if (data.isDefault) {
    await db
      .update(savedFilters)
      .set({ isDefault: false })
      .where(and(eq(savedFilters.userId, payload.userId), eq(savedFilters.module, data.module)));
  }

  const [updated] = await db
    .update(savedFilters)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(savedFilters.id, id), eq(savedFilters.userId, payload.userId)))
    .returning();

  if (!updated) {
    return c.json({ error: 'Filter not found' }, 404);
  }

  return c.json(updated);
});

filterRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const payload = c.get('jwtPayload');

  const result = await db
    .delete(savedFilters)
    .where(and(eq(savedFilters.id, id), eq(savedFilters.userId, payload.userId)));

  if (result.rowCount === 0) {
    return c.json({ error: 'Filter not found' }, 404);
  }

  return c.json({ message: 'Filter deleted' });
});

filterRoutes.get('/default/:module', async (c) => {
  const module = c.req.param('module');
  const payload = c.get('jwtPayload');

  const [filter] = await db
    .select()
    .from(savedFilters)
    .where(
      and(
        eq(savedFilters.userId, payload.userId),
        eq(savedFilters.module, module),
        eq(savedFilters.isDefault, true)
      )
    )
    .limit(1);

  return c.json(filter || null);
});
