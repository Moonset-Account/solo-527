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

  const [revenueResult, costResult, revenueByType, costByType, revenueByDate, costByDate, revenueByOwner, costByOwner] = await Promise.all([
    db
      .select({
        total: sql`COALESCE(${sum(revenues.amount)}, 0)`.as('total'),
        count: count(revenues.id),
      })
      .from(revenues)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
    db
      .select({
        total: sql`COALESCE(${sum(costs.amount)}, 0)`.as('total'),
        count: count(costs.id),
      })
      .from(costs)
      .where(costConditions.length > 0 ? and(...costConditions) : undefined),
    db
      .select({
        type: revenues.type,
        amount: sql`COALESCE(${sum(revenues.amount)}, 0)`.as('amount'),
      })
      .from(revenues)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(revenues.type)
      .orderBy(desc(sql`amount`)),
    db
      .select({
        type: costs.type,
        amount: sql`COALESCE(${sum(costs.amount)}, 0)`.as('amount'),
      })
      .from(costs)
      .where(costConditions.length > 0 ? and(...costConditions) : undefined)
      .groupBy(costs.type)
      .orderBy(desc(sql`amount`)),
    db
      .select({
        date: revenues.date,
        amount: sql`COALESCE(${sum(revenues.amount)}, 0)`.as('amount'),
      })
      .from(revenues)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(revenues.date)
      .orderBy(revenues.date),
    db
      .select({
        date: costs.date,
        amount: sql`COALESCE(${sum(costs.amount)}, 0)`.as('amount'),
      })
      .from(costs)
      .where(costConditions.length > 0 ? and(...costConditions) : undefined)
      .groupBy(costs.date)
      .orderBy(costs.date),
    db
      .select({
        owner: revenues.owner,
        amount: sql`COALESCE(${sum(revenues.amount)}, 0)`.as('amount'),
        count: count(revenues.id),
      })
      .from(revenues)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(revenues.owner),
    db
      .select({
        owner: costs.owner,
        amount: sql`COALESCE(${sum(costs.amount)}, 0)`.as('amount'),
        count: count(costs.id),
      })
      .from(costs)
      .where(costConditions.length > 0 ? and(...costConditions) : undefined)
      .groupBy(costs.owner),
  ]);

  const dateMap = new Map<string, { date: string; revenue: number; cost: number }>();
  for (const r of revenueByDate) {
    const d = String(r.date);
    dateMap.set(d, { date: d, revenue: Number(r.amount), cost: 0 });
  }
  for (const c of costByDate) {
    const d = String(c.date);
    if (dateMap.has(d)) {
      dateMap.get(d)!.cost = Number(c.amount);
    } else {
      dateMap.set(d, { date: d, revenue: 0, cost: Number(c.amount) });
    }
  }
  const byDate = Array.from(dateMap.values())
    .map((item) => ({ ...item, profit: item.revenue - item.cost }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const ownerMap = new Map<string, { owner: string; revenue: number; cost: number; revenueCount: number; costCount: number }>();
  for (const r of revenueByOwner) {
    const o = r.owner ?? '';
    ownerMap.set(o, { owner: o, revenue: Number(r.amount), cost: 0, revenueCount: r.count, costCount: 0 });
  }
  for (const c of costByOwner) {
    const o = c.owner ?? '';
    if (ownerMap.has(o)) {
      const item = ownerMap.get(o)!;
      item.cost = Number(c.amount);
      item.costCount = c.count;
    } else {
      ownerMap.set(o, { owner: o, revenue: 0, cost: Number(c.amount), revenueCount: 0, costCount: c.count });
    }
  }
  const byOwner = Array.from(ownerMap.values()).map((item) => ({
    ...item,
    profit: item.revenue - item.cost,
  }));

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
    byDate,
    byOwner,
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

  const [totalSubs, activeSubs, renewedSubs, byPlan, byDateRaw, byOwnerRaw] = await Promise.all([
    db
      .select({ count: count(subscriptions.id) })
      .from(subscriptions)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
    db
      .select({ count: count(subscriptions.id) })
      .from(subscriptions)
      .where(
        and(
          ...conditions,
          eq(subscriptions.status, 'active')
        )
      ),
    db
      .select({ count: count(subscriptions.id) })
      .from(subscriptions)
      .where(
        and(
          ...conditions,
          sql`${subscriptions.renewCount} > 0`
        )
      ),
    db
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
      .orderBy(desc(sql`total`)),
    db
      .select({
        date: sql`DATE(${subscriptions.startDate})`.as('date'),
        total: count(subscriptions.id),
        active: sql`COUNT(CASE WHEN ${subscriptions.status} = 'active' THEN 1 END)`.as('active'),
        renewed: sql`COUNT(CASE WHEN ${subscriptions.renewCount} > 0 THEN 1 END)`.as('renewed'),
      })
      .from(subscriptions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(sql`DATE(${subscriptions.startDate})`)
      .orderBy(sql`date`),
    db
      .select({
        owner: subscriptions.owner,
        total: count(subscriptions.id),
        active: sql`COUNT(CASE WHEN ${subscriptions.status} = 'active' THEN 1 END)`.as('active'),
        renewed: sql`COUNT(CASE WHEN ${subscriptions.renewCount} > 0 THEN 1 END)`.as('renewed'),
      })
      .from(subscriptions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(subscriptions.owner),
  ]);

  const total = totalSubs[0]?.count || 0;
  const active = activeSubs[0]?.count || 0;
  const renewed = renewedSubs[0]?.count || 0;

  const byDate = byDateRaw.map((item) => ({
    date: String(item.date),
    total: item.total,
    active: Number(item.active),
    renewed: Number(item.renewed),
  }));

  const byOwner = byOwnerRaw.map((item) => {
    const t = item.total;
    const a = Number(item.active);
    const r = Number(item.renewed);
    return {
      owner: item.owner ?? '',
      total: t,
      active: a,
      renewed: r,
      activeRate: t > 0 ? (a / t) * 100 : 0,
      renewalRate: t > 0 ? (r / t) * 100 : 0,
    };
  });

  return c.json({
    total,
    active,
    renewed,
    activeRate: total > 0 ? (active / total) * 100 : 0,
    renewalRate: total > 0 ? (renewed / total) * 100 : 0,
    byPlan,
    byDate,
    byOwner,
  });
});

app.get('/owners', async (c) => {
  const [revenueOwners, costOwners, subscriptionOwners] = await Promise.all([
    db.select({ owner: revenues.owner }).from(revenues).where(sql`${revenues.owner} IS NOT NULL AND ${revenues.owner} != ''`).groupBy(revenues.owner),
    db.select({ owner: costs.owner }).from(costs).where(sql`${costs.owner} IS NOT NULL AND ${costs.owner} != ''`).groupBy(costs.owner),
    db.select({ owner: subscriptions.owner }).from(subscriptions).where(sql`${subscriptions.owner} IS NOT NULL AND ${subscriptions.owner} != ''`).groupBy(subscriptions.owner),
  ]);

  const ownerSet = new Set<string>();
  for (const item of revenueOwners) {
    if (item.owner) ownerSet.add(item.owner);
  }
  for (const item of costOwners) {
    if (item.owner) ownerSet.add(item.owner);
  }
  for (const item of subscriptionOwners) {
    if (item.owner) ownerSet.add(item.owner);
  }

  return c.json({
    owners: Array.from(ownerSet).sort(),
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
