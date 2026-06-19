import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { publishSchedules, auditLogs, exceptions } from '../db/schema.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

const scheduleSchema = z.object({
  title: z.string().min(1),
  scriptId: z.string().uuid().optional(),
  platform: z.string().min(1),
  scheduledAt: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
  createdBy: z.string().min(1),
});

app.get('/', async (c) => {
  const { status, platform, from, to } = c.req.query();
  const conditions = [];
  if (status) conditions.push(eq(publishSchedules.status, status as any));
  if (platform) conditions.push(eq(publishSchedules.platform, platform));
  if (from) conditions.push(gte(publishSchedules.scheduledAt, new Date(from)));
  if (to) conditions.push(lte(publishSchedules.scheduledAt, new Date(to)));

  const result = await db
    .select()
    .from(publishSchedules)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${publishSchedules.scheduledAt} DESC NULLS LAST`);
  return c.json({ data: result });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [schedule] = await db.select().from(publishSchedules).where(eq(publishSchedules.id, id));
  if (!schedule) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: schedule });
});

app.post('/', zValidator('json', scheduleSchema), async (c) => {
  const body = c.req.valid('json');
  const [schedule] = await db.insert(publishSchedules).values({
    title: body.title,
    scriptId: body.scriptId,
    platform: body.platform,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    status: body.status || 'draft',
    createdBy: body.createdBy,
  }).returning();

  await db.insert(auditLogs).values({
    entityType: 'schedule',
    entityId: schedule.id,
    action: 'create',
    operator: body.createdBy,
    details: { title: body.title, platform: body.platform },
  });

  if (body.status === 'failed') {
    await db.insert(exceptions).values({
      scheduleId: schedule.id,
      type: 'publish_failed',
      description: `发布排期「${body.title}」发布失败`,
      status: 'open',
      createdBy: body.createdBy,
    });
  }

  return c.json({ data: schedule }, 201);
});

app.put('/:id', zValidator('json', scheduleSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const updateData: any = { ...body, updatedAt: new Date() };
  if (body.scheduledAt) updateData.scheduledAt = new Date(body.scheduledAt);

  const [updated] = await db
    .update(publishSchedules)
    .set(updateData)
    .where(eq(publishSchedules.id, id))
    .returning();
  if (!updated) return c.json({ error: 'Not found' }, 404);

  if (body.status === 'failed') {
    await db.insert(exceptions).values({
      scheduleId: id,
      type: 'publish_failed',
      description: `发布排期「${updated.title}」发布失败`,
      status: 'open',
      createdBy: body.createdBy || 'system',
    });
  }

  if (body.status === 'published') {
    updateData.publishedAt = new Date();
    await db
      .update(publishSchedules)
      .set({ publishedAt: new Date() })
      .where(eq(publishSchedules.id, id));
  }

  await db.insert(auditLogs).values({
    entityType: 'schedule',
    entityId: id,
    action: 'update',
    operator: body.createdBy || 'system',
  });

  return c.json({ data: updated });
});

export default app;
