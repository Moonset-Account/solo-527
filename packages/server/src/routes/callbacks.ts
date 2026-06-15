import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { callbacks, receipts } from '../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { callbackSchema, callbackRetrySchema } from '../validations/schema';

export const callbackRoutes = new Hono();

async function executeCallback(callback: typeof callbacks.$inferSelect) {
  try {
    const response = await fetch(callback.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callback.payload || {}),
    });

    const responseData = await response.json().catch(() => ({}));

    if (response.ok) {
      await db
        .update(callbacks)
        .set({
          status: 'success',
          response: responseData,
          lastAttemptAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(eq(callbacks.id, callback.id));
      return { success: true, response: responseData };
    } else {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
    }
  } catch (error: any) {
    const newRetryCount = (callback.retryCount || 0) + 1;
    await db
      .update(callbacks)
      .set({
        status: newRetryCount >= 3 ? 'failed' : 'retrying',
        errorMessage: error.message,
        retryCount: newRetryCount,
        lastAttemptAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(callbacks.id, callback.id));
    return { success: false, error: error.message };
  }
}

callbackRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const status = c.req.query('status');
  const callbackType = c.req.query('callbackType');
  const receiptId = c.req.query('receiptId');
  const receiptNo = c.req.query('receiptNo');

  let query = db
    .select({
      callback: callbacks,
      receipt: receipts,
    })
    .from(callbacks)
    .leftJoin(receipts, eq(callbacks.receiptId, receipts.id))
    .$dynamic();

  if (status) {
    query = query.where(eq(callbacks.status, status));
  }
  if (callbackType) {
    query = query.where(eq(callbacks.callbackType, callbackType));
  }
  if (receiptId) {
    query = query.where(eq(callbacks.receiptId, receiptId));
  }
  if (receiptNo) {
    query = query.where(eq(receipts.receiptNo, receiptNo));
  }

  const [items, countResult] = await Promise.all([
    query.orderBy(desc(callbacks.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(callbacks),
  ]);

  const formatted = items.map((row) => ({
    ...row.callback,
    receipt: row.receipt,
  }));

  return c.json({
    items: formatted,
    total: countResult[0].count,
    page,
    pageSize,
  });
});

callbackRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db
    .select({
      callback: callbacks,
      receipt: receipts,
    })
    .from(callbacks)
    .leftJoin(receipts, eq(callbacks.receiptId, receipts.id))
    .where(eq(callbacks.id, id))
    .limit(1);

  if (!result.length) {
    return c.json({ error: 'Callback not found' }, 404);
  }

  return c.json({
    ...result[0].callback,
    receipt: result[0].receipt,
  });
});

callbackRoutes.post('/', zValidator('json', callbackSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await db.insert(callbacks).values(data).returning();

  executeCallback(result[0]);

  return c.json(result[0], 201);
});

callbackRoutes.post('/:id/retry', zValidator('json', callbackRetrySchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const existing = await db.select().from(callbacks).where(eq(callbacks.id, id)).limit(1);
  if (!existing.length) {
    return c.json({ error: 'Callback not found' }, 404);
  }

  const updatedCallback = {
    ...existing[0],
    callbackUrl: data.callbackUrl || existing[0].callbackUrl,
    payload: data.payload || existing[0].payload,
    status: 'retrying' as const,
    retryCount: (existing[0].retryCount || 0),
  };

  await db
    .update(callbacks)
    .set({
      callbackUrl: updatedCallback.callbackUrl,
      payload: updatedCallback.payload,
      status: 'retrying',
      updatedAt: sql`now()`,
    })
    .where(eq(callbacks.id, id));

  const result = await executeCallback(updatedCallback);

  return c.json({
    success: result.success,
    message: result.success ? 'Callback retried successfully' : 'Callback retry failed',
    ...result,
  });
});

callbackRoutes.post('/retry-batch', async (c) => {
  const { status, callbackType, receiptId } = await c.req.json();

  let query = db.select().from(callbacks).$dynamic();

  const conditions = [];
  if (status) {
    conditions.push(eq(callbacks.status, status));
  }
  if (callbackType) {
    conditions.push(eq(callbacks.callbackType, callbackType));
  }
  if (receiptId) {
    conditions.push(eq(callbacks.receiptId, receiptId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const callbacksToRetry = await query;

  const results = await Promise.all(
    callbacksToRetry.map(async (callback) => {
      const result = await executeCallback(callback);
      return {
        callbackId: callback.id,
        ...result,
      };
    })
  );

  return c.json({
    total: callbacksToRetry.length,
    successCount: results.filter((r) => r.success).length,
    failedCount: results.filter((r) => !r.success).length,
    results,
  });
});

callbackRoutes.put('/:id', zValidator('json', callbackSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const result = await db
    .update(callbacks)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(callbacks.id, id))
    .returning();
  if (!result.length) {
    return c.json({ error: 'Callback not found' }, 404);
  }
  return c.json(result[0]);
});

callbackRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await db.delete(callbacks).where(eq(callbacks.id, id)).returning();
  if (!result.length) {
    return c.json({ error: 'Callback not found' }, 404);
  }
  return c.json({ message: 'Callback deleted successfully' });
});
