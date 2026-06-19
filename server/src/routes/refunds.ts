import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { refunds, orders, users, cityManagers } from '../db/schema';
import { eq, and, gte, lte, desc, asc, count } from 'drizzle-orm';

const router = new Hono();

const querySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  status: z.string().optional(),
  city: z.string().optional(),
  handledBy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const createRefundSchema = z.object({
  orderId: z.number(),
  amount: z.string(),
  reason: z.string(),
});

const handleRefundSchema = z.object({
  status: z.enum(['approved', 'rejected', 'completed']),
  handleNote: z.string().optional(),
  handledBy: z.number().optional(),
});

router.get('/', async (c) => {
  const query = querySchema.parse(c.req.query());
  const page = parseInt(query.page);
  const pageSize = parseInt(query.pageSize);
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (query.status) {
    conditions.push(eq(refunds.status, query.status as any));
  }
  if (query.handledBy) {
    conditions.push(eq(refunds.handledBy, parseInt(query.handledBy)));
  }
  if (query.startDate) {
    conditions.push(gte(refunds.createdAt, new Date(query.startDate)));
  }
  if (query.endDate) {
    conditions.push(lte(refunds.createdAt, new Date(query.endDate)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderByColumn = query.sortBy === 'createdAt' ? refunds.createdAt :
    query.sortBy === 'amount' ? refunds.amount : refunds.createdAt;

  const [totalResult, refundList] = await Promise.all([
    db.select({ count: count() }).from(refunds).where(where),
    db
      .select()
      .from(refunds)
      .leftJoin(orders, eq(refunds.orderId, orders.id))
      .leftJoin(users, eq(refunds.userId, users.id))
      .leftJoin(cityManagers, eq(refunds.handledBy, cityManagers.id))
      .where(where)
      .limit(pageSize)
      .offset(offset)
      .orderBy(query.sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn)),
  ]);

  const total = totalResult[0]?.count || 0;

  const formatted = refundList.map((row) => ({
    ...row.refunds,
    order: row.orders,
    user: row.users,
    handler: row.city_managers,
  }));

  return c.json({
    data: formatted,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

router.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  const result = await db
    .select()
    .from(refunds)
    .leftJoin(orders, eq(refunds.orderId, orders.id))
    .leftJoin(users, eq(refunds.userId, users.id))
    .leftJoin(cityManagers, eq(refunds.handledBy, cityManagers.id))
    .where(eq(refunds.id, id))
    .limit(1);

  if (result.length === 0) {
    return c.json({ error: '退款记录不存在' }, 404);
  }

  return c.json({
    ...result[0].refunds,
    order: result[0].orders,
    user: result[0].users,
    handler: result[0].city_managers,
  });
});

router.post('/', async (c) => {
  const body = await c.req.json();
  const data = createRefundSchema.parse(body);

  const order = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);
  if (order.length === 0) {
    return c.json({ error: '订单不存在' }, 404);
  }

  const refundNo = 'RF' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  const newRefund = await db
    .insert(refunds)
    .values({
      refundNo,
      orderId: data.orderId,
      userId: order[0].userId,
      amount: data.amount,
      reason: data.reason,
      status: 'pending',
    })
    .returning();

  return c.json(newRefund[0], 201);
});

router.put('/:id/handle', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const data = handleRefundSchema.parse(body);

  const updateData: any = {
    status: data.status,
    handledAt: new Date(),
  };
  if (data.handleNote) updateData.handleNote = data.handleNote;
  if (data.handledBy) updateData.handledBy = data.handledBy;

  const result = await db.update(refunds).set(updateData).where(eq(refunds.id, id)).returning();

  if (result.length === 0) {
    return c.json({ error: '退款记录不存在' }, 404);
  }

  if (data.status === 'completed') {
    await db.update(orders).set({ status: 'refunded' }).where(eq(orders.id, result[0].orderId));
  }

  return c.json(result[0]);
});

export default router;
