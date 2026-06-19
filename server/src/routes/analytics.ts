import { Hono } from 'hono';
import { db } from '../db';
import { orders, cityManagers, technicians, technicianLoads } from '../db/schema';
import { eq, and, gte, lte, count, avg, sum, sql, desc, asc } from 'drizzle-orm';

const router = new Hono();

router.get('/on-time-rate/by-date', async (c) => {
  const { startDate, endDate, city } = c.req.query();

  const conditions = [eq(orders.status, 'completed')];
  if (startDate) conditions.push(gte(orders.scheduledDate, startDate));
  if (endDate) conditions.push(lte(orders.scheduledDate, endDate));
  if (city) conditions.push(eq(orders.city, city));

  const where = and(...conditions);

  const result = await db
    .select({
      date: orders.scheduledDate,
      total: count(),
      onTime: sum(sql<number>`CASE WHEN ${orders.isOnTime} = true THEN 1 ELSE 0 END`),
      onTimeRate: avg(sql<number>`CASE WHEN ${orders.isOnTime} = true THEN 1 ELSE 0 END`) * 100,
    })
    .from(orders)
    .where(where)
    .groupBy(orders.scheduledDate)
    .orderBy(asc(orders.scheduledDate));

  return c.json(result);
});

router.get('/on-time-rate/by-city-manager', async (c) => {
  const { startDate, endDate, city } = c.req.query();

  const conditions = [eq(orders.status, 'completed')];
  if (startDate) conditions.push(gte(orders.scheduledDate, startDate));
  if (endDate) conditions.push(lte(orders.scheduledDate, endDate));
  if (city) conditions.push(eq(orders.city, city));

  const where = and(...conditions);

  const result = await db
    .select({
      cityManagerId: orders.cityManagerId,
      cityManagerName: cityManagers.name,
      city: cityManagers.city,
      total: count(),
      onTime: sum(sql<number>`CASE WHEN ${orders.isOnTime} = true THEN 1 ELSE 0 END`),
      onTimeRate: avg(sql<number>`CASE WHEN ${orders.isOnTime} = true THEN 1 ELSE 0 END`) * 100,
      delayed: sum(sql<number>`CASE WHEN ${orders.isOnTime} = false THEN 1 ELSE 0 END`),
    })
    .from(orders)
    .leftJoin(cityManagers, eq(orders.cityManagerId, cityManagers.id))
    .where(where)
    .groupBy(orders.cityManagerId, cityManagers.name, cityManagers.city)
    .orderBy(desc(sql`on_time_rate`));

  return c.json(result);
});

router.get('/delay-reasons', async (c) => {
  const { startDate, endDate, city, cityManagerId } = c.req.query();

  const conditions = [
    eq(orders.status, 'completed'),
    eq(orders.isOnTime, false),
  ];
  if (startDate) conditions.push(gte(orders.scheduledDate, startDate));
  if (endDate) conditions.push(lte(orders.scheduledDate, endDate));
  if (city) conditions.push(eq(orders.city, city));
  if (cityManagerId) conditions.push(eq(orders.cityManagerId, parseInt(cityManagerId)));

  const where = and(...conditions);

  const result = await db
    .select({
      reason: orders.delayReason,
      count: count(),
      percentage: sql<number>`count(*) * 100.0 / sum(count(*)) over ()`,
    })
    .from(orders)
    .where(where)
    .groupBy(orders.delayReason)
    .orderBy(desc(sql`count`));

  const totalDelayed = result.reduce((sum, r) => sum + Number(r.count), 0);

  return c.json({
    total: totalDelayed,
    reasons: result.map((r) => ({
      ...r,
      percentage: totalDelayed > 0 ? ((Number(r.count) / totalDelayed) * 100).toFixed(1) : '0',
    })),
  });
});

router.get('/supply-demand-gap', async (c) => {
  const { startDate, endDate, city } = c.req.query();

  const conditions = [];
  if (startDate) conditions.push(gte(technicianLoads.date, startDate));
  if (endDate) conditions.push(lte(technicianLoads.date, endDate));
  if (city) conditions.push(eq(technicianLoads.city, city));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const loadData = await db
    .select({
      date: technicianLoads.date,
      city: technicianLoads.city,
      totalAssigned: sum(technicianLoads.assignedCount),
      totalCompleted: sum(technicianLoads.completedCount),
      avgLoadRate: avg(technicianLoads.loadRate),
      overloadedCount: sum(sql<number>`CASE WHEN ${technicianLoads.loadRate} > 100 THEN 1 ELSE 0 END`),
      techCount: count(),
    })
    .from(technicianLoads)
    .where(where)
    .groupBy(technicianLoads.date, technicianLoads.city)
    .orderBy(asc(technicianLoads.date));

  return c.json(loadData);
});

router.get('/workload/by-technician', async (c) => {
  const { startDate, endDate, city } = c.req.query();

  const conditions = [];
  if (startDate) conditions.push(gte(technicianLoads.date, startDate));
  if (endDate) conditions.push(lte(technicianLoads.date, endDate));
  if (city) conditions.push(eq(technicianLoads.city, city));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      technicianId: technicianLoads.technicianId,
      technicianName: technicians.name,
      city: technicianLoads.city,
      totalAssigned: sum(technicianLoads.assignedCount),
      totalCompleted: sum(technicianLoads.completedCount),
      avgLoadRate: avg(technicianLoads.loadRate),
      days: count(),
    })
    .from(technicianLoads)
    .leftJoin(technicians, eq(technicianLoads.technicianId, technicians.id))
    .where(where)
    .groupBy(technicianLoads.technicianId, technicians.name, technicianLoads.city)
    .orderBy(desc(sql`avg_load_rate`));

  return c.json(result);
});

router.get('/overview', async (c) => {
  const { startDate, endDate, city } = c.req.query();

  const orderConditions = [];
  if (startDate) orderConditions.push(gte(orders.scheduledDate, startDate));
  if (endDate) orderConditions.push(lte(orders.scheduledDate, endDate));
  if (city) orderConditions.push(eq(orders.city, city));

  const orderWhere = orderConditions.length > 0 ? and(...orderConditions) : undefined;

  const loadConditions = [];
  if (startDate) loadConditions.push(gte(technicianLoads.date, startDate));
  if (endDate) loadConditions.push(lte(technicianLoads.date, endDate));
  if (city) loadConditions.push(eq(technicianLoads.city, city));

  const loadWhere = loadConditions.length > 0 ? and(...loadConditions) : undefined;

  const [orderStats, loadStats, delayStats] = await Promise.all([
    db
      .select({
        total: count(),
        completed: sum(sql<number>`CASE WHEN ${orders.status} = 'completed' THEN 1 ELSE 0 END`),
        pending: sum(sql<number>`CASE WHEN ${orders.status} = 'pending' THEN 1 ELSE 0 END`),
        cancelled: sum(sql<number>`CASE WHEN ${orders.status} = 'cancelled' THEN 1 ELSE 0 END`),
        onTimeRate: avg(sql<number>`CASE WHEN ${orders.isOnTime} = true THEN 1 ELSE 0 END`) * 100,
      })
      .from(orders)
      .where(orderWhere),
    db
      .select({
        avgLoadRate: avg(technicianLoads.loadRate),
        overloadedTechDays: sum(sql<number>`CASE WHEN ${technicianLoads.loadRate} > 100 THEN 1 ELSE 0 END`),
      })
      .from(technicianLoads)
      .where(loadWhere),
    db
      .select({
        reason: orders.delayReason,
        count: count(),
      })
      .from(orders)
      .where(and(...(orderConditions || []), eq(orders.isOnTime, false), eq(orders.status, 'completed')))
      .groupBy(orders.delayReason)
      .orderBy(desc(sql`count`))
      .limit(5),
  ]);

  return c.json({
    orders: orderStats[0] || { total: 0, completed: 0, pending: 0, cancelled: 0, onTimeRate: 0 },
    workload: loadStats[0] || { avgLoadRate: 0, overloadedTechDays: 0 },
    topDelayReasons: delayStats,
  });
});

export default router;
