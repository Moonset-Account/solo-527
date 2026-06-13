import { z } from "zod";
import { createHash } from "crypto";
import { router, protectedProcedure, publicProcedure, directorProcedure } from "../trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";

export const reportRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId || !ctx.user) {
      return null;
    }
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.role,
    };
  }),

  listUsers: protectedProcedure.query(async () => {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }),

  updateUserRole: directorProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["SALES_DIRECTOR", "SALES_MANAGER", "DATA_OPERATOR"]) }))
    .mutation(async ({ input }) => {
      const user = await db.user.findUnique({ where: { id: input.userId } });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }
      const updated = await db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
      return updated;
    }),

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

  exportMonthly: directorProcedure
    .input(z.object({ month: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const filename = `sales-report-${input.month}.xlsx`;
      const exportedAt = new Date().toISOString();
      const hashInput = `${filename}-${exportedAt}-${ctx.userId}`;
      const securityHash = "sha256:" + createHash("sha256").update(hashInput).digest("hex");

      return {
        success: true,
        filename,
        securityHash,
        exportedAt,
        userRole: ctx.role,
      };
    }),
});
