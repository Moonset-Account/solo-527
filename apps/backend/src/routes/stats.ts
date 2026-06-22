import { Hono } from 'hono';
import { db } from '../db';
import { devices, repairOrders, inspectionRecords, venueUsageReports, events } from '../db/schema';
import { eq, sql, gte, lte, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

export const statsRoutes = new Hono();

statsRoutes.use('*', authMiddleware);

statsRoutes.get('/device-status', async (c) => {
  const result = await db
    .select({
      status: devices.status,
      count: sql<number>`count(*)`,
    })
    .from(devices)
    .groupBy(devices.status);

  const total = result.reduce((sum, r) => sum + r.count, 0);
  const normalCount = result.find((r) => r.status === 'normal')?.count || 0;
  const rate = total > 0 ? ((normalCount / total) * 100).toFixed(2) : '0';

  return c.json({
    statusCounts: result,
    total,
    intactRate: parseFloat(rate),
  });
});

statsRoutes.get('/device-intact-rate', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');

  const conditions = [];
  if (startDate) {
    conditions.push(gte(inspectionRecords.inspectionDate, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(inspectionRecords.inspectionDate, new Date(endDate + ' 23:59:59')));
  }

  const result = await db
    .select({
      status: inspectionRecords.status,
      count: sql<number>`count(*)`,
    })
    .from(inspectionRecords)
    .where(and(...conditions))
    .groupBy(inspectionRecords.status);

  const total = result.reduce((sum, r) => sum + r.count, 0);
  const normalCount = result.find((r) => r.status === 'normal')?.count || 0;

  const dailyData = await db
    .select({
      date: sql<string>`DATE(${inspectionRecords.inspectionDate})`.as('date'),
      total: sql<number>`count(*)`,
      normal: sql<number>`SUM(CASE WHEN ${inspectionRecords.status} = 'normal' THEN 1 ELSE 0 END)`,
    })
    .from(inspectionRecords)
    .where(and(...conditions))
    .groupBy(sql`DATE(${inspectionRecords.inspectionDate})`)
    .orderBy(sql`DATE(${inspectionRecords.inspectionDate})`);

  return c.json({
    totalInspections: total,
    normalCount,
    intactRate: total > 0 ? parseFloat(((normalCount / total) * 100).toFixed(2)) : 0,
    dailyData: dailyData.map((d) => ({
      date: d.date,
      intactRate: d.total > 0 ? parseFloat(((d.normal / d.total) * 100).toFixed(2)) : 0,
    })),
  });
});

statsRoutes.get('/repair-summary', async (c) => {
  const result = await db
    .select({
      status: repairOrders.status,
      count: sql<number>`count(*)`,
    })
    .from(repairOrders)
    .groupBy(repairOrders.status);

  return c.json(result);
});

statsRoutes.get('/venue-utilization', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');

  const conditions = [];
  if (startDate) {
    conditions.push(gte(venueUsageReports.date, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(venueUsageReports.date, new Date(endDate)));
  }

  const reports = await db
    .select()
    .from(venueUsageReports)
    .where(and(...conditions))
    .orderBy(venueUsageReports.date);

  const totalHours = reports.reduce((sum, r) => sum + parseFloat(r.totalHours || '0'), 0);
  const usedHours = reports.reduce((sum, r) => sum + parseFloat(r.usedHours || '0'), 0);
  const avgUtilization = totalHours > 0 ? parseFloat(((usedHours / totalHours) * 100).toFixed(2)) : 0;

  return c.json({
    reports,
    summary: {
      totalHours: parseFloat(totalHours.toFixed(2)),
      usedHours: parseFloat(usedHours.toFixed(2)),
      avgUtilization,
    },
  });
});
