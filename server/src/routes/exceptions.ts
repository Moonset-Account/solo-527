import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { exceptionPool, exceptionLogs, orders } from '../db/schema.js';
import { eq, and, gte, lte, desc, asc, count, sql } from 'drizzle-orm';

const app = new Hono();

const exceptionQuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

const createExceptionSchema = z.object({
  category: z.string(),
  title: z.string(),
  description: z.string().optional(),
  relatedOrderId: z.number().optional(),
  delayDays: z.number().optional().default(0),
  priority: z.string().optional().default('medium'),
  assignee: z.string().optional(),
});

const updateExceptionSchema = z.object({
  category: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  assignee: z.string().optional(),
  delayDays: z.number().optional(),
});

const delayExceptionSchema = z.object({
  delayDays: z.number(),
  reason: z.string().optional(),
  operator: z.string().optional(),
});

const closeExceptionSchema = z.object({
  closeReason: z.string(),
  resultSummary: z.string().optional(),
  resultNote: z.string().optional(),
  closer: z.string().optional(),
});

const reopenExceptionSchema = z.object({
  reason: z.string(),
  operator: z.string().optional(),
});

const createLogSchema = z.object({
  action: z.string(),
  operator: z.string().optional(),
  detail: z.record(z.any()).optional(),
});

app.get('/', async (c) => {
  const query = c.req.query();
  const result = exceptionQuerySchema.safeParse(query);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { page, pageSize, status, category, priority, assignee, startDate, endDate } = result.data;
  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * sizeNum;

  const conditions = [];
  if (status) {
    conditions.push(eq(exceptionPool.status, status));
  }
  if (category) {
    conditions.push(eq(exceptionPool.category, category));
  }
  if (priority) {
    conditions.push(eq(exceptionPool.priority, priority));
  }
  if (assignee) {
    conditions.push(eq(exceptionPool.assignee, assignee));
  }
  if (startDate) {
    conditions.push(gte(exceptionPool.createdAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(exceptionPool.createdAt, new Date(endDate)));
  }

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: exceptionPool.id,
        category: exceptionPool.category,
        title: exceptionPool.title,
        description: exceptionPool.description,
        relatedOrderId: exceptionPool.relatedOrderId,
        delayDays: exceptionPool.delayDays,
        priority: exceptionPool.priority,
        status: exceptionPool.status,
        assignee: exceptionPool.assignee,
        createdAt: exceptionPool.createdAt,
        updatedAt: exceptionPool.updatedAt,
        closedAt: exceptionPool.closedAt,
        orderNo: orders.orderNo,
        orderAmount: orders.amount,
      })
      .from(exceptionPool)
      .leftJoin(orders, eq(exceptionPool.relatedOrderId, orders.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(exceptionPool.createdAt))
      .limit(sizeNum)
      .offset(offset),
    db
      .select({ count: count(exceptionPool.id) })
      .from(exceptionPool)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  const total = totalResult[0]?.count || 0;

  return c.json({
    items,
    total,
    page: pageNum,
    pageSize: sizeNum,
    totalPages: Math.ceil(total / sizeNum),
  });
});

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const exceptionList = await db
    .select({
      id: exceptionPool.id,
      category: exceptionPool.category,
      title: exceptionPool.title,
      description: exceptionPool.description,
      relatedOrderId: exceptionPool.relatedOrderId,
      delayDays: exceptionPool.delayDays,
      priority: exceptionPool.priority,
      status: exceptionPool.status,
      assignee: exceptionPool.assignee,
      closer: exceptionPool.closer,
      closeReason: exceptionPool.closeReason,
      resultSummary: exceptionPool.resultSummary,
      resultNote: exceptionPool.resultNote,
      reopenedFrom: exceptionPool.reopenedFrom,
      createdAt: exceptionPool.createdAt,
      updatedAt: exceptionPool.updatedAt,
      closedAt: exceptionPool.closedAt,
      orderNo: orders.orderNo,
      orderAmount: orders.amount,
    })
    .from(exceptionPool)
    .leftJoin(orders, eq(exceptionPool.relatedOrderId, orders.id))
    .where(eq(exceptionPool.id, id))
    .limit(1);

  const exception = exceptionList[0];

  if (!exception) {
    return c.json({ error: 'Exception not found' }, 404);
  }

  const logs = await db
    .select()
    .from(exceptionLogs)
    .where(eq(exceptionLogs.exceptionId, id))
    .orderBy(desc(exceptionLogs.createdAt));

  return c.json({ exception, logs });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const result = createExceptionSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const newExceptions = await db
    .insert(exceptionPool)
    .values(result.data)
    .returning();

  const exception = newExceptions[0];

  await db.insert(exceptionLogs).values({
    exceptionId: exception.id,
    action: 'created',
    detail: result.data as any,
  });

  return c.json({ exception }, 201);
});

app.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = updateExceptionSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const updated = await db
    .update(exceptionPool)
    .set({
      ...result.data,
      updatedAt: new Date(),
    })
    .where(eq(exceptionPool.id, id))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Exception not found' }, 404);
  }

  await db.insert(exceptionLogs).values({
    exceptionId: id,
    action: 'updated',
    detail: result.data as any,
  });

  return c.json({ exception: updated[0] });
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const deleted = await db
    .delete(exceptionPool)
    .where(eq(exceptionPool.id, id))
    .returning();

  if (deleted.length === 0) {
    return c.json({ error: 'Exception not found' }, 404);
  }

  return c.json({ message: 'Exception deleted successfully' });
});

app.post('/:id/delay', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = delayExceptionSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { delayDays, reason, operator } = result.data;

  const updated = await db
    .update(exceptionPool)
    .set({
      delayDays: sql`${exceptionPool.delayDays} + ${delayDays}`,
      updatedAt: new Date(),
    })
    .where(eq(exceptionPool.id, id))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Exception not found' }, 404);
  }

  await db.insert(exceptionLogs).values({
    exceptionId: id,
    action: 'delayed',
    operator,
    detail: { delayDays, reason } as any,
  });

  return c.json({ exception: updated[0] });
});

app.post('/:id/close', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = closeExceptionSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { closeReason, resultSummary, resultNote, closer } = result.data;

  const updated = await db
    .update(exceptionPool)
    .set({
      status: 'closed',
      closeReason,
      resultSummary,
      resultNote,
      closer,
      closedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(exceptionPool.id, id))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Exception not found' }, 404);
  }

  await db.insert(exceptionLogs).values({
    exceptionId: id,
    action: 'closed',
    operator: closer,
    detail: { closeReason, resultSummary, resultNote } as any,
  });

  return c.json({ exception: updated[0] });
});

app.post('/:id/reopen', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = reopenExceptionSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { reason, operator } = result.data;

  const originalList = await db
    .select()
    .from(exceptionPool)
    .where(eq(exceptionPool.id, id))
    .limit(1);

  if (originalList.length === 0) {
    return c.json({ error: 'Exception not found' }, 404);
  }

  const originalException = originalList[0];

  const newExceptions = await db
    .insert(exceptionPool)
    .values({
      category: originalException.category,
      title: originalException.title,
      description: originalException.description,
      relatedOrderId: originalException.relatedOrderId,
      priority: originalException.priority,
      assignee: originalException.assignee,
      status: 'open',
      reopenedFrom: originalException.id,
      delayDays: 0,
    })
    .returning();

  const newException = newExceptions[0];

  await Promise.all([
    db.insert(exceptionLogs).values({
      exceptionId: originalException.id,
      action: 'reopened_from',
      operator,
      detail: { newExceptionId: newException.id, reason } as any,
    }),
    db.insert(exceptionLogs).values({
      exceptionId: newException.id,
      action: 'reopened_to',
      operator,
      detail: { originalExceptionId: originalException.id, reason } as any,
    }),
  ]);

  return c.json({
    exception: newException,
    originalException,
  });
});

app.get('/:id/logs', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const logs = await db
    .select()
    .from(exceptionLogs)
    .where(eq(exceptionLogs.exceptionId, id))
    .orderBy(desc(exceptionLogs.createdAt));

  return c.json({ logs });
});

app.post('/:id/logs', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = createLogSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const newLogs = await db
    .insert(exceptionLogs)
    .values({
      exceptionId: id,
      ...result.data,
    })
    .returning();

  return c.json({ log: newLogs[0] }, 201);
});

export default app;
