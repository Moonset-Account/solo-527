import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { tags, materialTags } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

const app = new Hono();

app.get('/', async (c) => {
  const result = await db.select({
    id: tags.id,
    name: tags.name,
    color: tags.color,
    createdAt: tags.createdAt,
    usageCount: sql<number>`count(${materialTags.materialId})`,
  }).from(tags)
    .leftJoin(materialTags, eq(tags.id, materialTags.tagId))
    .groupBy(tags.id)
    .orderBy(tags.name);
  return c.json({ data: result });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const [tag] = await db.insert(tags).values({
    name: body.name,
    color: body.color,
  }).returning();
  return c.json({ data: tag }, 201);
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await db.delete(materialTags).where(eq(materialTags.tagId, id));
  const [deleted] = await db.delete(tags).where(eq(tags.id, id)).returning();
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: deleted });
});

export default app;
