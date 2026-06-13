import { z } from "zod";
import { createTRPCRouter, managerProcedure, adminProcedure } from "../trpc";

export const logRouter = createTRPCRouter({
  list: managerProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(50),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      operatorId: z.string().optional(),
      action: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.entityType) where.entityType = input.entityType;
      if (input.entityId) where.entityId = input.entityId;
      if (input.operatorId) where.operatorId = input.operatorId;
      if (input.action) where.action = input.action;
      if (input.dateFrom || input.dateTo) {
        where.createdAt = {};
        if (input.dateFrom) (where.createdAt as never).gte = input.dateFrom;
        if (input.dateTo) (where.createdAt as never).lte = input.dateTo;
      }

      const [total, list] = await Promise.all([
        ctx.db.operationLog.count({ where }),
        ctx.db.operationLog.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: { operator: true },
        }),
      ]);
      return { total, list };
    }),

  byEntity: managerProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.operationLog.findMany({
        where: { entityType: input.entityType, entityId: input.entityId },
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: { operator: true },
      });
    }),

  entityTypes: managerProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.operationLog.groupBy({
      by: ["entityType"],
      _count: true,
    });
    return result.map((r) => ({ type: r.entityType, count: r._count }));
  }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, total, byOperator, byEntity, byAction] = await Promise.all([
      ctx.db.operationLog.count({ where: { createdAt: { gte: today } } }),
      ctx.db.operationLog.count(),
      ctx.db.operationLog.groupBy({
        by: ["operatorId"],
        _count: true,
        orderBy: { _count: { operatorId: "desc" } },
        take: 10,
      }),
      ctx.db.operationLog.groupBy({
        by: ["entityType"],
        _count: true,
      }),
      ctx.db.operationLog.groupBy({
        by: ["action"],
        _count: true,
      }),
    ]);

    return { todayCount, total, byOperator, byEntity, byAction };
  }),
});
