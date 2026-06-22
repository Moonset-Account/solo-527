import { Hono } from 'hono';
import { db } from '../db';
import { venueUsageReports, events, coachSchedules } from '../db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

export const reportRoutes = new Hono();

reportRoutes.use('*', authMiddleware);

reportRoutes.get('/venue-usage', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '30');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (startDate) {
    conditions.push(gte(venueUsageReports.date, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(venueUsageReports.date, new Date(endDate)));
  }

  const [reports, total] = await Promise.all([
    db
      .select()
      .from(venueUsageReports)
      .where(and(...conditions))
      .orderBy(desc(venueUsageReports.date))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(venueUsageReports)
      .where(and(...conditions))
      .then((res) => res[0].count),
  ]);

  const totalHours = reports.reduce((sum, r) => sum + parseFloat(r.totalHours || '0'), 0);
  const usedHours = reports.reduce((sum, r) => sum + parseFloat(r.usedHours || '0'), 0);
  const totalEvents = reports.reduce((sum, r) => sum + (r.eventCount || 0), 0);
  const totalCourses = reports.reduce((sum, r) => sum + (r.courseCount || 0), 0);
  const avgUtilization = totalHours > 0 ? parseFloat(((usedHours / totalHours) * 100).toFixed(2)) : 0;

  return c.json({
    data: reports,
    total,
    page,
    limit,
    summary: {
      totalHours: parseFloat(totalHours.toFixed(2)),
      usedHours: parseFloat(usedHours.toFixed(2)),
      avgUtilization,
      totalEvents,
      totalCourses,
    },
  });
});

reportRoutes.get('/venue-usage/monthly', async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');

  const conditions = [];
  if (startDate) {
    conditions.push(gte(venueUsageReports.date, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(venueUsageReports.date, new Date(endDate)));
  }

  const monthlyData = await db
    .select({
      month: sql<string>`TO_CHAR(${venueUsageReports.date}, 'YYYY-MM')`.as('month'),
      totalHours: sql<number>`SUM(${venueUsageReports.totalHours}::numeric)`,
      usedHours: sql<number>`SUM(${venueUsageReports.usedHours}::numeric)`,
      eventCount: sql<number>`SUM(${venueUsageReports.eventCount})`,
      courseCount: sql<number>`SUM(${venueUsageReports.courseCount})`,
    })
    .from(venueUsageReports)
    .where(and(...conditions))
    .groupBy(sql`TO_CHAR(${venueUsageReports.date}, 'YYYY-MM')`)
    .orderBy(sql`month`);

  return c.json(
    monthlyData.map((m) => ({
      month: m.month,
      totalHours: parseFloat(m.totalHours.toFixed(2)),
      usedHours: parseFloat(m.usedHours.toFixed(2)),
      utilizationRate: m.totalHours > 0 ? parseFloat(((m.usedHours / m.totalHours) * 100).toFixed(2)) : 0,
      eventCount: m.eventCount,
      courseCount: m.courseCount,
    }))
  );
});
