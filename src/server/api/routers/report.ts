import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@/server/db";

export const reportRouter = router({
  getMonthly: publicProcedure
    .input(z.object({ month: z.string() }))
    .query(async ({ input }) => {
      const [year, month] = input.month.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const anomalies = await db.anomaly.findMany({
        where: {
          detectedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: { metric: true },
      });

      const totalAnomalies = anomalies.length;
      const resolvedAnomalies = anomalies.filter((a: { status: string }) => a.status === "RESOLVED").length;

      let avgResolutionTime = 0;
      const resolved = anomalies.filter((a: { status: string; resolvedAt: Date | null }) => a.status === "RESOLVED" && a.resolvedAt);
      if (resolved.length > 0) {
        const totalHours = resolved.reduce((acc: number, a: any) => {
          const hours = (a.resolvedAt.getTime() - a.detectedAt.getTime()) / (1000 * 60 * 60);
          return acc + hours;
        }, 0);
        avgResolutionTime = Math.round((totalHours / resolved.length) * 10) / 10;
      }

      const anomaliesBySeverity = anomalies.reduce<Record<string, number>>((acc, a: { severity: string }) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      }, {});

      const anomaliesByMetric = anomalies.reduce<Record<string, number>>((acc, a: { metric: { name: string } }) => {
        const name = a.metric.name;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      const topAnomalies = [...anomalies]
        .sort((a, b) => Math.abs(b.deviationPercentage) - Math.abs(a.deviationPercentage))
        .slice(0, 10);

      const metricChanges = await db.metricChangeLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: {
          metric: { select: { name: true, code: true } },
          createdBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        month: input.month,
        totalAnomalies,
        resolvedAnomalies,
        resolutionRate: totalAnomalies > 0 ? Math.round((resolvedAnomalies / totalAnomalies) * 100) : 0,
        avgResolutionTime,
        anomaliesBySeverity,
        anomaliesByMetric,
        topAnomalies,
        metricChanges,
      };
    }),

  getOverview: publicProcedure.query(async () => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const [thisMonthData, lastMonthData, activeAlerts, metrics] = await Promise.all([
      db.anomaly.count({ where: { detectedAt: { gte: thisMonthStart } } }),
      db.anomaly.count({
        where: { detectedAt: { gte: lastMonthStart, lt: lastMonthEnd } },
      }),
      db.anomaly.count({
        where: { status: { in: ["OPEN", "INVESTIGATING"] } },
      }),
      db.metric.count({ where: { isActive: true } }),
    ]);

    const monthOverMonth = lastMonthData > 0
      ? Math.round(((thisMonthData - lastMonthData) / lastMonthData) * 100)
      : 0;

    return {
      thisMonthAnomalies: thisMonthData,
      lastMonthAnomalies: lastMonthData,
      monthOverMonth,
      activeAlerts,
      totalMetrics: metrics,
    };
  }),

  getResolutionRate: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const anomalies = await db.anomaly.findMany({
        where: { detectedAt: { gte: startDate } },
        select: { status: true, detectedAt: true, resolvedAt: true },
      });

      const weeklyData: Array<{
        week: string;
        total: number;
        resolved: number;
        rate: number;
      }> = [];

      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const totalWeeks = Math.ceil(input.days / 7);

      for (let i = totalWeeks - 1; i >= 0; i--) {
        const weekEnd = new Date(startDate.getTime() + (totalWeeks - i) * weekMs);
        const weekStart = new Date(weekEnd.getTime() - weekMs);
        
        const weekAnomalies = anomalies.filter(
          (a: { detectedAt: Date }) => a.detectedAt >= weekStart && a.detectedAt < weekEnd,
        );
        
        const resolved = weekAnomalies.filter((a: { status: string }) => a.status === "RESOLVED").length;
        
        weeklyData.push({
          week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          total: weekAnomalies.length,
          resolved,
          rate: weekAnomalies.length > 0 ? Math.round((resolved / weekAnomalies.length) * 100) : 0,
        });
      }

      return weeklyData;
    }),
});
