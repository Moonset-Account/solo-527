import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { rescheduleLogs, orders } from '../db/schema';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';

const router = new Hono();

const querySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  orderId: z.string().optional(),
  isCancellation: z.string().optional(),
  operatorType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const rescheduleSchema = z.object({
  orderId: z.number(),
  newDate: z.string(),
  newTimeSlot: z.string(),
  reason: z.string().optional(),
  operatorType: z.enum(['customer', 'staff']).default('customer'),
  operatorId: z.number().optional(),
});

const cancelSchema = z.object({
  orderId: z.number(),
  reason: z.string(),
  operatorType: z.enum(['customer', 'staff']).default('customer'),
  operatorId: z.number().optional(),
});

router.get('/', async (c) => {
  const query = querySchema.parse(c.req.query());
  const page = parseInt(query.page);
  const pageSize = parseInt(query.pageSize);
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (query.orderId) {
    conditions.push(eq(rescheduleLogs.orderId, parseInt(query.orderId)));
  }
  if (query.isCancellation !== undefined) {
    conditions.push(eq(rescheduleLogs.isCancellation, query.isCancellation === 'true'));
  }
  if (query.operatorType) {
    conditions.push(eq(rescheduleLogs.operatorType, query.operatorType));
  }
  if (query.startDate) {
    conditions.push(gte(rescheduleLogs.createdAt, new Date(query.startDate)));
  }
  if (query.endDate) {
    conditions.push(lte(rescheduleLogs.createdAt, new Date(query.endDate)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, logList] = await Promise.all([
    db.select({ count: count() }).from(rescheduleLogs).where(where),
    db
      .select()
      .from(rescheduleLogs)
      .leftJoin(orders, eq(rescheduleLogs.orderId, orders.id))
      .where(where)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(rescheduleLogs.createdAt)),
  ]);

  const total = totalResult[0]?.count || 0;

  const formatted = logList.map((row) => ({
    ...row.reschedule_logs,
    order: row.orders,
  }));

  return c.json({
    data: formatted,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

router.post('/reschedule', async (c) => {
  const body = await c.req.json();
  const data = rescheduleSchema.parse(body);

  const order = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);
  if (order.length === 0) {
    return c.json({ error: '订单不存在' }, 404);
  }

  await db
    .insert(rescheduleLogs)
    .values({
      orderId: data.orderId,
      oldDate: order[0].scheduledDate,
      newDate: data.newDate,
      oldTimeSlot: order[0].scheduledTimeSlot,
      newTimeSlot: data.newTimeSlot,
      reason: data.reason,
      operatorType: data.operatorType,
      operatorId: data.operatorId,
      isCancellation: false,
    });

  await db
    .update(orders)
    .set({
      scheduledDate: data.newDate,
      scheduledTimeSlot: data.newTimeSlot,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, data.orderId));

  return c.json({ success: true, message: '改约成功' });
});

router.post('/cancel', async (c) => {
  const body = await c.req.json();
  const data = cancelSchema.parse(body);

  const order = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);
  if (order.length === 0) {
    return c.json({ error: '订单不存在' }, 404);
  }

  await db
    .insert(rescheduleLogs)
    .values({
      orderId: data.orderId,
      oldDate: order[0].scheduledDate,
      oldTimeSlot: order[0].scheduledTimeSlot,
      reason: data.reason,
      operatorType: data.operatorType,
      operatorId: data.operatorId,
      isCancellation: true,
    });

  await db
    .update(orders)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(orders.id, data.orderId));

  return c.json({ success: true, message: '取消成功' });
});

export default router;
