import { Hono } from 'hono';
import { db } from '../db/index';
import {
  zones,
  energyRecords,
  alerts,
  meters,
  devices,
  subsidyRecords,
  energySavingTargets,
  energySavingDetails,
  users,
} from '../db/schema';
import { eq, and, gte, lte, sql, desc, count, isNull } from 'drizzle-orm';

const app = new Hono();

async function getCurrentUser() {
  const [user] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  return user;
}

function parseNum(val: any): number {
  if (val === null || val === undefined) return 0;
  return Number(val);
}

app.get('/summary', async (c) => {
  const [capacityResult] = await db
    .select({ totalCapacity: sql<number>`COALESCE(sum(${zones.capacity}), 0)`.mapWith(Number) })
    .from(zones);
  const totalCapacity = parseNum(capacityResult?.totalCapacity || 0);

  const [productionResult] = await db
    .select({ totalProduction: sql<number>`COALESCE(sum(${energyRecords.production}), 0)`.mapWith(Number) })
    .from(energyRecords);
  const totalProduction = parseNum(productionResult?.totalProduction || 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayResult] = await db
    .select({
      todayProduction: sql<number>`COALESCE(sum(${energyRecords.production}), 0)`.mapWith(Number),
      todayConsumption: sql<number>`COALESCE(sum(${energyRecords.consumption}), 0)`.mapWith(Number),
    })
    .from(energyRecords)
    .where(
      and(
        gte(energyRecords.timestamp, today),
        lte(energyRecords.timestamp, tomorrow)
      )
    );
  const todayProduction = parseNum(todayResult?.todayProduction || 0);
  const todayConsumption = parseNum(todayResult?.todayConsumption || 0);

  const activeAlertsResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(alerts)
    .where(sql`${alerts.status} IN ('pending', 'processing')`);
  const activeAlerts = activeAlertsResult[0]?.count || 0;

  const onlineMetersResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(meters)
    .where(eq(meters.status, 'online'));
  const onlineMeters = onlineMetersResult[0]?.count || 0;

  const offlineMetersResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(meters)
    .where(eq(meters.status, 'offline'));
  const offlineMeters = offlineMetersResult[0]?.count || 0;

  const [subsidyResult] = await db
    .select({ monthlySubsidy: sql<number>`COALESCE(sum(${subsidyRecords.subsidyAmount}), 0)`.mapWith(Number) })
    .from(subsidyRecords)
    .where(sql`${subsidyRecords.status} IN ('approved', 'paid')`);
  const monthlySubsidy = parseNum(subsidyResult?.monthlySubsidy || 0);

  const [yearlyTarget] = await db
    .select()
    .from(energySavingTargets)
    .where(eq(energySavingTargets.period, 'yearly'))
    .limit(1);

  let targetProgress = 0;
  if (yearlyTarget) {
    const [savedResult] = await db
      .select({ saved: sql<number>`COALESCE(sum(${energySavingDetails.savedKwh}), 0)`.mapWith(Number) })
      .from(energySavingDetails)
      .where(eq(energySavingDetails.targetId, yearlyTarget.id));
    const saved = parseNum(savedResult?.saved || 0);
    const targetKwh = parseNum(yearlyTarget.targetKwh);
    targetProgress = targetKwh > 0 ? Math.min(1, saved / targetKwh) * 100 : 0;
  }

  const [zoneCountResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(zones);
  const zoneCount = zoneCountResult?.count || 0;

  const [deviceCountResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(devices);
  const deviceCount = deviceCountResult?.count || 0;

  const user = await getCurrentUser();

  return c.json({
    success: true,
    data: {
      totalCapacity: Number(totalCapacity.toFixed(0)),
      totalProduction: Number(totalProduction.toFixed(1)),
      todayProduction: Number(todayProduction.toFixed(1)),
      todayConsumption: Number(todayConsumption.toFixed(1)),
      activeAlerts,
      onlineMeters,
      offlineMeters,
      monthlySubsidy: Number(monthlySubsidy.toFixed(2)),
      targetProgress: Number(targetProgress.toFixed(1)),
      zoneCount,
      deviceCount,
      user,
    },
  });
});

app.get('/zone-stats', async (c) => {
  const zoneList = await db.select().from(zones).orderBy(zones.name);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const stats = [];
  for (const zone of zoneList) {
    const [todayProdResult] = await db
      .select({ production: sql<number>`COALESCE(sum(${energyRecords.production}), 0)`.mapWith(Number) })
      .from(energyRecords)
      .where(
        and(
          eq(energyRecords.zoneId, zone.id),
          gte(energyRecords.timestamp, today),
          lte(energyRecords.timestamp, tomorrow)
        )
      );
    const prodToday = parseNum(todayProdResult?.production || 0);

    const [monthProdResult] = await db
      .select({ production: sql<number>`COALESCE(sum(${energyRecords.production}), 0)`.mapWith(Number) })
      .from(energyRecords)
      .where(
        and(
          eq(energyRecords.zoneId, zone.id),
          gte(energyRecords.timestamp, monthStart),
          lte(energyRecords.timestamp, nextMonth)
        )
      );
    const prodMonth = parseNum(monthProdResult?.production || 0);

    const [activeAlertsResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(alerts)
      .where(
        and(
          eq(alerts.zoneId, zone.id),
          sql`${alerts.status} IN ('pending', 'processing')`
        )
      );
    const activeAlerts = activeAlertsResult?.count || 0;

    const [deviceCountResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(devices)
      .where(eq(devices.zoneId, zone.id));
    const deviceCount = deviceCountResult?.count || 0;

    const [meterCountResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(meters)
      .where(eq(meters.zoneId, zone.id));
    const meterCount = meterCountResult?.count || 0;

    const recentEffRecords = await db
      .select({ efficiency: energyRecords.efficiency })
      .from(energyRecords)
      .where(eq(energyRecords.zoneId, zone.id))
      .orderBy(desc(energyRecords.timestamp))
      .limit(50);
    const eff = recentEffRecords.length > 0
      ? recentEffRecords.reduce((s, r) => s + parseNum(r.efficiency), 0) / recentEffRecords.length
      : 0;

    stats.push({
      zoneId: zone.id,
      zoneName: zone.name,
      capacity: parseNum(zone.capacity),
      productionToday: Number(prodToday.toFixed(1)),
      productionMonth: Number(prodMonth.toFixed(1)),
      activeAlerts,
      deviceCount,
      meterCount,
      avgEfficiency: Number(eff.toFixed(2)),
    });
  }

  return c.json({ success: true, data: stats });
});

app.get('/energy-trend', async (c) => {
  const days = Number(c.req.query('days') || '7');
  const zoneId = c.req.query('zoneId');

  const data: Array<{ date: string; production: number; consumption: number; gridExport: number; gridImport: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const conditions: any[] = [
      gte(energyRecords.timestamp, d),
      lte(energyRecords.timestamp, next),
    ];
    if (zoneId) conditions.push(eq(energyRecords.zoneId, zoneId));
    const where = and(...conditions);

    const [dayResult] = await db
      .select({
        production: sql<number>`COALESCE(sum(${energyRecords.production}), 0)`.mapWith(Number),
        consumption: sql<number>`COALESCE(sum(${energyRecords.consumption}), 0)`.mapWith(Number),
        gridExport: sql<number>`COALESCE(sum(${energyRecords.gridExport}), 0)`.mapWith(Number),
        gridImport: sql<number>`COALESCE(sum(${energyRecords.gridImport}), 0)`.mapWith(Number),
      })
      .from(energyRecords)
      .where(where);

    data.push({
      date: d.toISOString().slice(0, 10),
      production: Number(parseNum(dayResult?.production || 0).toFixed(1)),
      consumption: Number(parseNum(dayResult?.consumption || 0).toFixed(1)),
      gridExport: Number(parseNum(dayResult?.gridExport || 0).toFixed(1)),
      gridImport: Number(parseNum(dayResult?.gridImport || 0).toFixed(1)),
    });
  }

  return c.json({ success: true, data });
});

app.get('/alert-summary', async (c) => {
  const levelsResult = await db
    .select({
      level: alerts.level,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(alerts)
    .groupBy(alerts.level);
  const levels: Record<string, number> = { critical: 0, warning: 0, info: 0 };
  for (const row of levelsResult) {
    levels[row.level] = row.count;
  }

  const statusesResult = await db
    .select({
      status: alerts.status,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(alerts)
    .groupBy(alerts.status);
  const statuses: Record<string, number> = { pending: 0, processing: 0, resolved: 0, ignored: 0 };
  for (const row of statusesResult) {
    statuses[row.status] = row.count;
  }

  const recent = await db
    .select({
      id: alerts.id,
      deviceId: alerts.deviceId,
      zoneId: alerts.zoneId,
      level: alerts.level,
      title: alerts.title,
      description: alerts.description,
      status: alerts.status,
      assignee: alerts.assignee,
      acknowledgedBy: alerts.acknowledgedBy,
      acknowledgedAt: alerts.acknowledgedAt,
      resolvedBy: alerts.resolvedBy,
      resolvedAt: alerts.resolvedAt,
      sourceData: alerts.sourceData,
      createdAt: alerts.createdAt,
      updatedAt: alerts.updatedAt,
      zoneName: zones.name,
      deviceName: devices.name,
    })
    .from(alerts)
    .leftJoin(zones, eq(alerts.zoneId, zones.id))
    .leftJoin(devices, eq(alerts.deviceId, devices.id))
    .orderBy(desc(alerts.createdAt))
    .limit(10);

  return c.json({ success: true, data: { levels, statuses, recent } });
});

app.get('/users', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const pageSize = Number(c.req.query('pageSize') || '20');

  const totalResult = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(users);
  const total = totalResult[0]?.count || 0;

  const data = await db
    .select()
    .from(users)
    .orderBy(users.name)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return c.json({
    success: true,
    data: {
      data,
      total,
      page,
      pageSize,
    },
  });
});

app.get('/users/list', async (c) => {
  const data = await db.select().from(users).orderBy(users.name);
  return c.json({ success: true, data });
});

app.get('/current-user', async (c) => {
  const user = await getCurrentUser();
  return c.json({ success: true, data: user });
});

app.get('/me', async (c) => {
  const user = await getCurrentUser();
  return c.json({ success: true, data: user });
});

export default app;
