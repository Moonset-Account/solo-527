import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "@/server/api/trpc";
import { searchChangeRecords, type TrackedEntity } from "@/server/services/auditService";

export const auditRouter = router({
  list: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        entityType: z.enum(["LEASE", "BILL", "ASSIGNMENT", "SETTLEMENT", "CONTRACT"]).optional(),
        entityId: z.string().optional(),
        fieldName: z.string().optional(),
        operatorId: z.string().optional(),
        changedFrom: z.date().optional(),
        changedTo: z.date().optional(),
        oldValue: z.string().optional(),
        newValue: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return searchChangeRecords(input);
    }),

  getFieldNames: adminProcedure
    .input(z.object({ entityType: z.enum(["LEASE", "BILL", "ASSIGNMENT", "SETTLEMENT", "CONTRACT"]) }))
    .query(async ({ ctx, input }) => {
      const records = await ctx.db.changeRecord.findMany({
        where: { entityType: input.entityType },
        select: { fieldName: true },
        distinct: ["fieldName"],
        orderBy: { fieldName: "asc" },
      });

      return records.map((r) => r.fieldName);
    }),

  getEntityHistory: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["LEASE", "BILL", "ASSIGNMENT", "SETTLEMENT", "CONTRACT"]),
        entityId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.changeRecord.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
        },
        include: {
          operator: { select: { id: true, name: true, role: true } },
        },
        orderBy: { changedAt: "desc" },
      });
    }),

  getEntityTypes: adminProcedure.query(() => {
    return [
      { value: "LEASE", label: "租约" },
      { value: "BILL", label: "账单" },
      { value: "ASSIGNMENT", label: "派工" },
      { value: "SETTLEMENT", label: "结算" },
      { value: "CONTRACT", label: "合同" },
    ];
  }),

  getOperators: adminProcedure.query(async ({ ctx }) => {
    const operators = await ctx.db.user.findMany({
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });

    return operators;
  }),

  getStats: adminProcedure.query(async ({ ctx }) => {
    const [todayCount, weekCount, monthCount, total] = await Promise.all([
      ctx.db.changeRecord.count({
        where: { changedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      ctx.db.changeRecord.count({
        where: { changedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      ctx.db.changeRecord.count({
        where: { changedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      ctx.db.changeRecord.count(),
    ]);

    return { todayCount, weekCount, monthCount, total };
  }),
});
