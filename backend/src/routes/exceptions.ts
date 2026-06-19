import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { exceptions, publishSchedules, auditLogs } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

const exceptionUpdateSchema = z.object({
  status: z.enum(['open', 'processing', 'closed']).optional(),
  handler: z.string().optional(),
  closeExplanation: z.string().optional(),
});

app.get('/', async (c) => {
  const { status } = c.req.query();
  const conditions = [];
  if (status) conditions.push(eq(exceptions.status, status as any));

  const result = await db
    .select({
      id: exceptions.id,
      scheduleId: exceptions.scheduleId,
      type: exceptions.type,
      description: exceptions.description,
      status: exceptions.status,
      handler: exceptions.handler,
      handledAt: exceptions.handledAt,
      closeExplanation: exceptions.closeExplanation,
      createdBy: exceptions.createdBy,
      createdAt: exceptions.createdAt,
      updatedAt: exceptions.updatedAt,
      scheduleTitle: publishSchedules.title,
      platform: publishSchedules.platform,
    })
    .from(exceptions)
    .leftJoin(publishSchedules, eq(exceptions.scheduleId, publishSchedules.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${exceptions.createdAt} DESC`);
  return c.json({ data: result });
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [ex] = await db
    .select({
      id: exceptions.id,
      scheduleId: exceptions.scheduleId,
      type: exceptions.type,
      description: exceptions.description,
      status: exceptions.status,
      handler: exceptions.handler,
      handledAt: exceptions.handledAt,
      closeExplanation: exceptions.closeExplanation,
      createdBy: exceptions.createdBy,
      createdAt: exceptions.createdAt,
      updatedAt: exceptions.updatedAt,
      scheduleTitle: publishSchedules.title,
      platform: publishSchedules.platform,
    })
    .from(exceptions)
    .leftJoin(publishSchedules, eq(exceptions.scheduleId, publishSchedules.id))
    .where(eq(exceptions.id, id));
  if (!ex) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: ex });
});

app.put('/:id', zValidator('json', exceptionUpdateSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');

  if (body.status === 'closed' && !body.closeExplanation) {
    return c.json({ error: '关闭异常时必须填写说明' }, 400);
  }

  const updateData: any = { ...body, updatedAt: new Date() };
  if (body.status === 'processing' || body.status === 'closed') {
    updateData.handledAt = new Date();
  }

  const [updated] = await db
    .update(exceptions)
    .set(updateData)
    .where(eq(exceptions.id, id))
    .returning();
  if (!updated) return c.json({ error: 'Not found' }, 404);

  await db.insert(auditLogs).values({
    entityType: 'exception',
    entityId: id,
    action: body.status === 'closed' ? 'close' : 'update',
    operator: body.handler || 'system',
    details: { status: body.status, closeExplanation: body.closeExplanation },
  });

  return c.json({ data: updated });
});

export default app;
