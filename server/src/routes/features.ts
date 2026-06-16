import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { featureToggles } from '../db/schema.js';
import { eq, desc, count } from 'drizzle-orm';

const app = new Hono();

const createFeatureSchema = z.object({
  featureKey: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isEnabled: z.boolean().optional().default(true),
});

const updateFeatureSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

const toggleFeatureSchema = z.object({
  isEnabled: z.boolean(),
});

app.get('/', async (c) => {
  const features = await db
    .select()
    .from(featureToggles)
    .orderBy(desc(featureToggles.updatedAt));

  return c.json({ features });
});

app.get('/:key', async (c) => {
  const key = c.req.param('key');

  const featureList = await db
    .select()
    .from(featureToggles)
    .where(eq(featureToggles.featureKey, key))
    .limit(1);

  const feature = featureList[0];

  if (!feature) {
    return c.json({ error: 'Feature toggle not found' }, 404);
  }

  return c.json({ feature });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const result = createFeatureSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  try {
    const newFeatures = await db
      .insert(featureToggles)
      .values(result.data)
      .returning();

    return c.json({ feature: newFeatures[0] }, 201);
  } catch (error: any) {
    if (error?.code === '23505') {
      return c.json({ error: 'Feature key already exists' }, 409);
    }
    throw error;
  }
});

app.put('/:key', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.json();
  const result = updateFeatureSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const data: any = { ...result.data };
  data.updatedAt = new Date();

  const updated = await db
    .update(featureToggles)
    .set(data)
    .where(eq(featureToggles.featureKey, key))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Feature toggle not found' }, 404);
  }

  return c.json({ feature: updated[0] });
});

app.post('/:key/toggle', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.json();
  const result = toggleFeatureSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const updated = await db
    .update(featureToggles)
    .set({
      isEnabled: result.data.isEnabled,
      updatedAt: new Date(),
    })
    .where(eq(featureToggles.featureKey, key))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Feature toggle not found' }, 404);
  }

  return c.json({ feature: updated[0] });
});

app.post('/:key/enable', async (c) => {
  const key = c.req.param('key');

  const updated = await db
    .update(featureToggles)
    .set({
      isEnabled: true,
      updatedAt: new Date(),
    })
    .where(eq(featureToggles.featureKey, key))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Feature toggle not found' }, 404);
  }

  return c.json({ feature: updated[0] });
});

app.post('/:key/disable', async (c) => {
  const key = c.req.param('key');

  const updated = await db
    .update(featureToggles)
    .set({
      isEnabled: false,
      updatedAt: new Date(),
    })
    .where(eq(featureToggles.featureKey, key))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Feature toggle not found' }, 404);
  }

  return c.json({ feature: updated[0] });
});

app.delete('/:key', async (c) => {
  const key = c.req.param('key');

  const deleted = await db
    .delete(featureToggles)
    .where(eq(featureToggles.featureKey, key))
    .returning();

  if (deleted.length === 0) {
    return c.json({ error: 'Feature toggle not found' }, 404);
  }

  return c.json({ message: 'Feature toggle deleted successfully' });
});

export default app;
