import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";

export const anomalyRouter = router({
  list: publicProcedure
    .input(
      z.object({
        status: z.array(z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "IGNORED"])).optional(),
        severity: z.array(z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])).optional(),
        metricId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      }),
    )
    .query(async ({ input }) => {
      const where = {
        ...(input.status?.length ? { status: { in: input.status } } : {}),
        ...(input.severity?.length ? { severity: { in: input.severity } } : {}),
        ...(input.metricId ? { metricId: input.metricId } : {}),
        ...(input.startDate || input.endDate
          ? {
              detectedAt: {
                ...(input.startDate ? { gte: input.startDate } : {}),
                ...(input.endDate ? { lte: input.endDate } : {}),
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        db.anomaly.findMany({
          where,
          include: {
            metric: true,
            alertRule: { select: { name: true } },
            assignedTo: { select: { name: true, avatarUrl: true } },
          },
          orderBy: { detectedAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        db.anomaly.count({ where }),
      ]);

      return { items, total };
    }),

  getById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const anomaly = await db.anomaly.findUnique({
        where: { id: input },
        include: {
          metric: true,
          alertRule: true,
          assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
          comments: {
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (!anomaly) {
        throw new TRPCError({ code: "NOT_FOUND", message: "异常记录不存在" });
      }
      return anomaly;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "IGNORED"]),
      }),
    )
    .mutation(async ({ input }) => {
      const anomaly = await db.anomaly.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
        },
        include: { metric: true },
      });
      return anomaly;
    }),

  updateRootCause: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        rootCause: z.string(),
        rootCauseCategory: z.string(),
        summary: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const anomaly = await db.anomaly.update({
        where: { id },
        data,
      });
      return anomaly;
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        anomalyId: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const comment = await db.anomalyComment.create({
        data: {
          anomalyId: input.anomalyId,
          userId: ctx.userId,
          content: input.content,
        },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      });
      return comment;
    }),

  assign: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const anomaly = await db.anomaly.update({
        where: { id: input.id },
        data: { assignedToId: input.userId },
      });
      return anomaly;
    }),

  getSummary: publicProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ input }) => {
      const anomalies = await db.anomaly.findMany({
        where: {
          detectedAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
      });

      const total = anomalies.length;
      const bySeverity = anomalies.reduce<Record<string, number>>((acc, a: { severity: string }) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      }, {});

      const byStatus = anomalies.reduce<Record<string, number>>((acc, a: { status: string }) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});

      const open = anomalies.filter((a: { status: string }) => a.status === "OPEN" || a.status === "INVESTIGATING").length;
      const resolved = anomalies.filter((a: { status: string }) => a.status === "RESOLVED").length;

      return {
        total,
        open,
        resolved,
        bySeverity,
        byStatus,
      };
    }),

  getTrendData: publicProcedure
    .input(
      z.object({
        days: z.number().default(30),
      }),
    )
    .query(async ({ input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const anomalies = await db.anomaly.findMany({
        where: {
          detectedAt: {
            gte: startDate,
          },
        },
        orderBy: { detectedAt: "asc" },
      });

      const dailyData: Record<string, { date: string; count: number; high: number; critical: number }> = {};
      
      for (let i = 0; i < input.days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split("T")[0];
        dailyData[key] = { date: key, count: 0, high: 0, critical: 0 };
      }

      for (const a of anomalies) {
        const key = a.detectedAt.toISOString().split("T")[0];
        if (dailyData[key]) {
          dailyData[key].count++;
          if (a.severity === "HIGH") dailyData[key].high++;
          if (a.severity === "CRITICAL") dailyData[key].critical++;
        }
      }

      return Object.values(dailyData);
    }),
});
