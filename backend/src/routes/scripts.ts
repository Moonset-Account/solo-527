import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { topicScripts, auditLogs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

const scriptSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  materialId: z.string().uuid().optional(),
  createdBy: z.string().min(1),
});

app.get('/', async (c) => {
  const { materialId } = c.req.query();
  const conditions = [];
  if (materialId) {
    conditions.push(eq(topicScripts.materialId, materialId));
  }
  const result = await db
    .select()
    .from(topicScripts)
    .where(conditions.length > 0 ? eq(topicScripts.materialId, materialId!) : undefined)
    .orderBy(topicScripts.createdAt);
  return c.json({ data: result });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [script] = await db.select().from(topicScripts).where(eq(topicScripts.id, id));
  if (!script) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: script });
});

app.post('/', zValidator('json', scriptSchema), async (c) => {
  const body = c.req.valid('json');
  const [script] = await db.insert(topicScripts).values(body).returning();

  await db.insert(auditLogs).values({
    entityType: 'script',
    entityId: script.id,
    action: 'create',
    operator: body.createdBy,
    details: { title: body.title },
  });

  return c.json({ data: script }, 201);
});

app.put('/:id', zValidator('json', scriptSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const [updated] = await db
    .update(topicScripts)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(topicScripts.id, id))
    .returning();
  if (!updated) return c.json({ error: 'Not found' }, 404);

  await db.insert(auditLogs).values({
    entityType: 'script',
    entityId: id,
    action: 'update',
    operator: body.createdBy || 'system',
  });

  return c.json({ data: updated });
});

export default app;
