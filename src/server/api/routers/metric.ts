import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";

export const metricRouter = router({
  list: publicProcedure.query(async () => {
    const metrics = await db.metric.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return metrics;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const metric = await db.metric.findUnique({
        where: { id: input.id },
        include: { changeLogs: { orderBy: { createdAt: "desc" }, take: 5 } },
      });
      if (!metric) {
        throw new TRPCError({ code: "NOT_FOUND", message: "指标不存在" });
      }
      return metric;
    }),

  getData: publicProcedure
    .input(
      z.object({
        metricId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        period: z.enum(["DAY", "WEEK", "MONTH"]),
      }),
    )
    .query(async ({ input }) => {
      const data = await db.metricDataPoint.findMany({
        where: {
          metricId: input.metricId,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
          period: input.period,
        },
        orderBy: { date: "asc" },
      });
      return data;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        code: z.string(),
        description: z.string().optional(),
        formula: z.string().optional(),
        dataSource: z.string().optional(),
        unit: z.string(),
        category: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.metric.findUnique({ where: { code: input.code } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "指标编码已存在" });
      }

      const metric = await db.metric.create({
        data: input,
      });
      return metric;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        formula: z.string().optional(),
        dataSource: z.string().optional(),
        unit: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const metric = await db.metric.update({
        where: { id },
        data,
      });
      return metric;
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      await db.metric.update({
        where: { id: input },
        data: { isActive: false },
      });
      return { success: true };
    }),

  getChangeLogs: publicProcedure
    .input(z.object({ metricId: z.string().optional() }))
    .query(async ({ input }) => {
      const logs = await db.metricChangeLog.findMany({
        where: input.metricId ? { metricId: input.metricId } : undefined,
        include: {
          metric: { select: { name: true, code: true } },
          createdBy: { select: { name: true, email: true } },
          approvedBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return logs;
    }),
});
