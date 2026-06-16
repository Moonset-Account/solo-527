import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { subscriptions, membershipPlans, users, orders } from '../db/schema.js';
import { eq, and, gte, lte, desc, asc, like, count, sql } from 'drizzle-orm';

const app = new Hono();

const subscriptionQuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  status: z.string().optional(),
  planId: z.string().optional(),
  owner: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

const createSubscriptionSchema = z.object({
  userId: z.number(),
  planId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string().optional().default('active'),
  autoRenew: z.boolean().optional().default(true),
  owner: z.string().optional(),
});

const updateSubscriptionSchema = z.object({
  status: z.string().optional(),
  autoRenew: z.boolean().optional(),
  endDate: z.string().optional(),
  cancelReason: z.string().optional(),
});

app.get('/', async (c) => {
  const query = c.req.query();
  const result = subscriptionQuerySchema.safeParse(query);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { page, pageSize, status, planId, owner, startDate, endDate, search } = result.data;
  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * sizeNum;

  const conditions = [];
  if (status) {
    conditions.push(eq(subscriptions.status, status));
  }
  if (planId) {
    conditions.push(eq(subscriptions.planId, parseInt(planId, 10)));
  }
  if (owner) {
    conditions.push(eq(subscriptions.owner, owner));
  }
  if (startDate) {
    conditions.push(gte(subscriptions.startDate, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(subscriptions.startDate, new Date(endDate)));
  }

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        planId: subscriptions.planId,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        status: subscriptions.status,
        autoRenew: subscriptions.autoRenew,
        owner: subscriptions.owner,
        renewCount: subscriptions.renewCount,
        createdAt: subscriptions.createdAt,
        userName: users.name,
        userEmail: users.email,
        planName: membershipPlans.name,
        planPrice: membershipPlans.price,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .leftJoin(membershipPlans, eq(subscriptions.planId, membershipPlans.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(subscriptions.createdAt))
      .limit(sizeNum)
      .offset(offset),
    db
      .select({ count: count(subscriptions.id) })
      .from(subscriptions)
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

  const subscriptionList = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      planId: subscriptions.planId,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      status: subscriptions.status,
      autoRenew: subscriptions.autoRenew,
      owner: subscriptions.owner,
      renewCount: subscriptions.renewCount,
      canceledAt: subscriptions.canceledAt,
      cancelReason: subscriptions.cancelReason,
      createdAt: subscriptions.createdAt,
      userName: users.name,
      userEmail: users.email,
      planName: membershipPlans.name,
      planPrice: membershipPlans.price,
      planFeatures: membershipPlans.features,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.userId, users.id))
    .leftJoin(membershipPlans, eq(subscriptions.planId, membershipPlans.id))
    .where(eq(subscriptions.id, id))
    .limit(1);

  const subscription = subscriptionList[0];

  if (!subscription) {
    return c.json({ error: 'Subscription not found' }, 404);
  }

  const renewOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.subscriptionId, id))
    .orderBy(desc(orders.createdAt));

  return c.json({ subscription, renewOrders });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const result = createSubscriptionSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { userId, planId, startDate, endDate, status, autoRenew, owner } = result.data;

  const newSubscriptions = await db
    .insert(subscriptions)
    .values({
      userId,
      planId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      autoRenew,
      owner,
    })
    .returning();

  return c.json({ subscription: newSubscriptions[0] }, 201);
});

app.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json();
  const result = updateSubscriptionSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const data: any = {};
  if (result.data.status !== undefined) data.status = result.data.status;
  if (result.data.autoRenew !== undefined) data.autoRenew = result.data.autoRenew;
  if (result.data.endDate !== undefined) data.endDate = new Date(result.data.endDate);
  if (result.data.cancelReason !== undefined) {
    data.cancelReason = result.data.cancelReason;
    data.canceledAt = new Date();
  }

  const updated = await db
    .update(subscriptions)
    .set(data)
    .where(eq(subscriptions.id, id))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: 'Subscription not found' }, 404);
  }

  return c.json({ subscription: updated[0] });
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const deleted = await db
    .delete(subscriptions)
    .where(eq(subscriptions.id, id))
    .returning();

  if (deleted.length === 0) {
    return c.json({ error: 'Subscription not found' }, 404);
  }

  return c.json({ message: 'Subscription deleted successfully' });
});

app.get('/:id/renewals', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const renewals = await db
    .select()
    .from(orders)
    .where(eq(orders.subscriptionId, id))
    .orderBy(desc(orders.createdAt));

  return c.json({ renewals });
});

app.get('/plans/list', async (c) => {
  const plans = await db
    .select()
    .from(membershipPlans)
    .where(eq(membershipPlans.isActive, true))
    .orderBy(asc(membershipPlans.sortOrder));

  return c.json({ plans });
});

export default app;
