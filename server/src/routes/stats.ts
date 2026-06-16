import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { revenues, costs, subscriptions, membershipPlans, users } from '../db/schema.js';
import { and, gte, lte, eq, desc, sql, sum, count } from 'drizzle-orm';

const app = new Hono();

const statsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  owner: z.string().optional(),
});

app.get('/revenue-cost', async (c) => {
  const query = c.req.query();
  const result = statsQuerySchema.safeParse(query);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { startDate, endDate, owner } = result.data;

  const conditions = [];
  if (startDate) {
    conditions.push(gte(revenues.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(revenues.date, endDate));
  }
  if (owner) {
    conditions.push(eq(revenues.owner, owner));
  }

  const revenueResult = await db
    .select({
      total: sql`COALESCE(${sum(revenues.amount)}, 0)`.as('total'),
      count: count(revenues.id),
    })
    .from(revenues)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const costConditions = [];
  if (startDate) {
    costConditions.push(gte(costs.date, startDate));
  }
  if (endDate) {
    costConditions.push(lte(costs.date, endDate));
  }
  if (owner) {
    costConditions.push(eq(costs.owner, owner));
  }

  const costResult = await db
    .select({
      total: sql`COALESCE(${sum(costs.amount)}, 0)`.as('total'),
      count: count(costs.id),
    })
    .from(costs)
    .where(costConditions.length > 0 ? and(...costConditions) : undefined);

  const revenueByType = await db
    .select({
      type: revenues.type,
      amount: sql`COALESCE(${sum(revenues.amount)}, 0)`.as('amount'),
    })
    .from(revenues)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(revenues.type)
    .orderBy(desc(sql`amount`));

  const costByType = await db
    .select({
      type: costs.type,
      amount: sql`COALESCE(${sum(costs.amount)}, 0)`.as('amount'),
    })
    .from(costs)
    .where(costConditions.length > 0 ? and(...costConditions) : undefined)
    .groupBy(costs.type)
    .orderBy(desc(sql`amount`));

  return c.json({
    revenue: {
      total: revenueResult[0]?.total || '0',
      count: revenueResult[0]?.count || 0,
      byType: revenueByType,
    },
    cost: {
      total: costResult[0]?.total || '0',
      count: costResult[0]?.count || 0,
      byType: costByType,
    },
    profit: Number(revenueResult[0]?.total || 0) - Number(costResult[0]?.total || 0),
  });
});

app.get('/retention', async (c) => {
  const query = c.req.query();
  const result = statsQuerySchema.safeParse(query);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { startDate, endDate, owner } = result.data;

  const conditions = [];
  if (startDate) {
    conditions.push(gte(subscriptions.startDate, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(subscriptions.startDate, new Date(endDate)));
  }
  if (owner) {
    conditions.push(eq(subscriptions.owner, owner));
  }

  const totalSubs = await db
    .select({ count: count(subscriptions.id) })
    .from(subscriptions)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const activeSubs = await db
    .select({ count: count(subscriptions.id) })
    .from(subscriptions)
    .where(
      and(
        ...conditions,
        eq(subscriptions.status, 'active')
      )
    );

  const renewedSubs = await db
    .select({ count: count(subscriptions.id) })
    .from(subscriptions)
    .where(
      and(
        ...conditions,
        sql`${subscriptions.renewCount} > 0`
      )
    );

  const byPlan = await db
    .select({
      planId: subscriptions.planId,
      planName: membershipPlans.name,
      total: count(subscriptions.id),
      active: sql`COUNT(CASE WHEN ${subscriptions.status} = 'active' THEN 1 END)`.as('active'),
    })
    .from(subscriptions)
    .leftJoin(membershipPlans, eq(subscriptions.planId, membershipPlans.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(subscriptions.planId, membershipPlans.name)
    .orderBy(desc(sql`total`));

  const total = totalSubs[0]?.count || 0;
  const active = activeSubs[0]?.count || 0;
  const renewed = renewedSubs[0]?.count || 0;

  return c.json({
    total,
    active,
    renewed,
    activeRate: total > 0 ? (active / total) * 100 : 0,
    renewalRate: total > 0 ? (renewed / total) * 100 : 0,
    byPlan,
  });
});

app.get('/members', async (c) => {
  const query = c.req.query();
  const result = statsQuerySchema.safeParse(query);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { startDate, endDate } = result.data;

  const conditions = [];
  if (startDate) {
    conditions.push(gte(users.createdAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(users.createdAt, new Date(endDate)));
  }

  const totalUsers = await db
    .select({ count: count(users.id) })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const byRole = await db
    .select({
      role: users.role,
      count: count(users.id),
    })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(users.role)
    .orderBy(desc(count(users.id)));

  return c.json({
    total: totalUsers[0]?.count || 0,
    byRole,
  });
});

export default app;
