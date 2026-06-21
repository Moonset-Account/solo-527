import { z } from "zod";
import { router, protectedProcedure, financeProcedure, auditedProcedure } from "@/server/api/trpc";
import { SettlementStatus, type Settlement } from "@prisma/client";
import { recordChanges, getChangeHistory } from "@/server/services/auditService";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export const settlementRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.array(z.enum([SettlementStatus.PENDING, SettlementStatus.CONFIRMED, SettlementStatus.PAID])).optional(),
        ownerName: z.string().optional(),
        propertyName: z.string().optional(),
        periodFrom: z.string().optional(),
        periodTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, ownerName, propertyName, periodFrom, periodTo } = input;

      const where: any = {};
      if (status?.length) where.status = { in: status };
      if (ownerName) where.lease = { owner: { name: { contains: ownerName, mode: "insensitive" } } };
      if (propertyName) where.lease = { ...where.lease, property: { name: { contains: propertyName, mode: "insensitive" } } };
      if (periodFrom) where.periodFrom = { gte: new Date(periodFrom) };
      if (periodTo) where.periodTo = { lte: new Date(periodTo) };

      const [total, settlements] = await Promise.all([
        ctx.db.settlement.count({ where }),
        ctx.db.settlement.findMany({
          where,
          include: {
            lease: {
              include: {
                property: { select: { name: true } },
                tenant: { select: { name: true } },
                owner: { select: { name: true, phone: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        settlements: settlements.map((s) => ({
          id: s.id,
          settlementNo: s.settlementNo,
          periodFrom: s.periodFrom,
          periodTo: s.periodTo,
          totalRent: s.totalRent.toNumber(),
          managementFee: s.managementFee.toNumber(),
          otherDeductions: s.otherDeductions.toNumber(),
          ownerAmount: s.ownerAmount.toNumber(),
          status: s.status,
          paidDate: s.paidDate,
          remark: s.remark,
          propertyName: s.lease.property.name,
          tenantName: s.lease.tenant.name,
          ownerName: s.lease.owner.name,
          ownerPhone: s.lease.owner.phone,
          createdAt: s.createdAt,
        })),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const settlement = await ctx.db.settlement.findUnique({
        where: { id: input.id },
        include: {
          lease: {
            include: {
              property: { select: { name: true, address: true } },
              tenant: { select: { name: true, phone: true } },
              owner: { select: { name: true, phone: true, email: true } },
            },
          },
        },
      });

      if (!settlement) return null;

      const changeHistory = await getChangeHistory("SETTLEMENT", settlement.id);

      return {
        ...settlement,
        totalRent: settlement.totalRent.toNumber(),
        managementFee: settlement.managementFee.toNumber(),
        otherDeductions: settlement.otherDeductions.toNumber(),
        ownerAmount: settlement.ownerAmount.toNumber(),
        changeHistory,
      };
    }),

  create: financeProcedure
    .input(
      z.object({
        leaseId: z.string(),
        periodFrom: z.date(),
        periodTo: z.date(),
        managementFee: z.number().default(0),
        otherDeductions: z.number().default(0),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lease = await ctx.db.lease.findUnique({
        where: { id: input.leaseId },
        select: { monthlyRent: true },
      });

      if (!lease) throw new Error("租约不存在");

      const totalRent = lease.monthlyRent.toNumber();
      const ownerAmount = totalRent - input.managementFee - input.otherDeductions;

      const settlementNo = `SETTLE${format(input.periodFrom, "yyyyMM")}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      return ctx.db.settlement.create({
        data: {
          ...input,
          totalRent,
          ownerAmount,
          settlementNo,
          status: SettlementStatus.PENDING,
        },
      });
    }),

  confirm: financeProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, reason } = input;

      const oldSettlement = await ctx.db.settlement.findUnique({ where: { id } });
      if (!oldSettlement) throw new Error("结算单不存在");

      const updateData = { status: SettlementStatus.CONFIRMED };

      const [updated] = await Promise.all([
        ctx.db.settlement.update({ where: { id }, data: updateData as Partial<Settlement> }),
        recordChanges("SETTLEMENT", id, oldSettlement, updateData as Partial<Settlement>, ctx.user, reason || "确认结算"),
      ]);

      return updated;
    }),

  markPaid: financeProcedure
    .input(
      z.object({
        id: z.string(),
        paidDate: z.date().default(() => new Date()),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, paidDate, reason } = input;

      const oldSettlement = await ctx.db.settlement.findUnique({ where: { id } });
      if (!oldSettlement) throw new Error("结算单不存在");

      const updateData = { status: SettlementStatus.PAID, paidDate };

      const [updated] = await Promise.all([
        ctx.db.settlement.update({ where: { id }, data: updateData as Partial<Settlement> }),
        recordChanges("SETTLEMENT", id, oldSettlement, updateData as Partial<Settlement>, ctx.user, reason || "标记已付款"),
      ]);

      return updated;
    }),

  getByLeaseId: protectedProcedure
    .input(z.object({ leaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const settlements = await ctx.db.settlement.findMany({
        where: { leaseId: input.leaseId },
        orderBy: { createdAt: "desc" },
      });

      return settlements.map((s) => ({
        id: s.id,
        settlementNo: s.settlementNo,
        periodFrom: s.periodFrom,
        periodTo: s.periodTo,
        totalRent: s.totalRent.toNumber(),
        ownerAmount: s.ownerAmount.toNumber(),
        status: s.status,
      }));
    }),

  getSummary: financeProcedure.query(async ({ ctx }) => {
    const [pending, confirmed, paid, totalAmount] = await Promise.all([
      ctx.db.settlement.count({ where: { status: SettlementStatus.PENDING } }),
      ctx.db.settlement.count({ where: { status: SettlementStatus.CONFIRMED } }),
      ctx.db.settlement.count({ where: { status: SettlementStatus.PAID } }),
      ctx.db.settlement.aggregate({
        _sum: { ownerAmount: true },
        where: { status: SettlementStatus.PAID },
      }),
    ]);

    return {
      pending,
      confirmed,
      paid,
      totalPaidAmount: totalAmount._sum.ownerAmount?.toNumber() ?? 0,
    };
  }),
});
