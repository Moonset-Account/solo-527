import { z } from "zod";
import { router, protectedProcedure, financeProcedure } from "@/server/api/trpc";
import { SettlementStatus, type Settlement } from "@prisma/client";
import { recordChanges, getChangeHistory } from "@/server/services/auditService";
import { format } from "date-fns";

export const settlementRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.union([z.string(), z.array(z.string())]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, search } = input;

      const where: any = {};
      if (status) {
        if (Array.isArray(status)) {
          where.status = { in: status };
        } else {
          where.status = status;
        }
      }
      if (search) {
        where.OR = [
          { settlementNo: { contains: search, mode: "insensitive" } },
          { lease: { owner: { name: { contains: search, mode: "insensitive" } } },
          { lease: { property: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [total, settlements] = await Promise.all([
        ctx.db.settlement.count({ where }),
        ctx.db.settlement.findMany({
          where,
          include: {
            lease: {
              include: {
                property: { select: { name: true, address: true } },
                tenant: { select: { name: true, phone: true } },
                owner: { select: { name: true, phone: true, email: true } },
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
        items: settlements.map((s) => ({
          id: s.id,
          settlementNo: s.settlementNo,
          startDate: s.periodFrom,
          endDate: s.periodTo,
          amount: s.ownerAmount.toNumber(),
          rentAmount: s.totalRent.toNumber(),
          managementFee: s.managementFee.toNumber(),
          otherFee: s.otherDeductions.toNumber(),
          status: s.status,
          paidDate: s.paidDate,
          remark: s.remark,
          createdAt: s.createdAt,
          property: {
            name: s.lease.property.name,
            address: s.lease.property.address,
          },
          owner: {
            name: s.lease.owner.name,
            phone: s.lease.owner.phone,
          },
          tenant: {
            name: s.lease.tenant.name,
            phone: s.lease.tenant.phone,
          },
        })),
        settlements: settlements.map((s) => ({
          id: s.id,
          settlementNo: s.settlementNo,
          periodFrom: s.periodFrom,
          periodTo: s.periodTo,
          ownerAmount: s.ownerAmount.toNumber(),
          totalRent: s.totalRent.toNumber(),
          managementFee: s.managementFee.toNumber(),
          otherDeductions: s.otherDeductions.toNumber(),
          status: s.status,
          paidDate: s.paidDate,
          remark: s.remark,
          createdAt: s.createdAt,
          propertyName: s.lease.property.name,
          propertyAddress: s.lease.property.address,
          ownerName: s.lease.owner.name,
          ownerPhone: s.lease.owner.phone,
          tenantName: s.lease.tenant.name,
          tenantPhone: s.lease.tenant.phone,
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
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, remark } = input;

      const oldSettlement = await ctx.db.settlement.findUnique({ where: { id } });
      if (!oldSettlement) throw new Error("结算单不存在");

      const updateData: any = { status: SettlementStatus.CONFIRMED };

      const [updated] = await Promise.all([
        ctx.db.settlement.update({ where: { id }, data: updateData }),
        recordChanges("SETTLEMENT", id, oldSettlement, updateData, ctx.user, remark || "确认结算"),
      ]);

      return updated;
    }),

  markPaid: financeProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const oldSettlement = await ctx.db.settlement.findUnique({ where: { id } });
      if (!oldSettlement) throw new Error("结算单不存在");

      const updateData: any = { status: SettlementStatus.PAID, paidDate: new Date() };

      const [updated] = await Promise.all([
        ctx.db.settlement.update({ where: { id }, data: updateData }),
        recordChanges("SETTLEMENT", id, oldSettlement, updateData, ctx.user, "标记已付款"),
      ]);

      return updated;
    }),

  getStats: financeProcedure.query(async ({ ctx }) => {
    const [pending, confirmed, paid, total, pendingAmount, confirmedAmount, paidAmount, totalAmount] = await Promise.all([
      ctx.db.settlement.count({ where: { status: SettlementStatus.PENDING } }),
      ctx.db.settlement.count({ where: { status: SettlementStatus.CONFIRMED } }),
      ctx.db.settlement.count({ where: { status: SettlementStatus.PAID } }),
      ctx.db.settlement.count(),
      ctx.db.settlement.aggregate({ _sum: { ownerAmount: true }, where: { status: SettlementStatus.PENDING } }),
      ctx.db.settlement.aggregate({ _sum: { ownerAmount: true }, where: { status: SettlementStatus.CONFIRMED } }),
      ctx.db.settlement.aggregate({ _sum: { ownerAmount: true }, where: { status: SettlementStatus.PAID } }),
      ctx.db.settlement.aggregate({ _sum: { ownerAmount: true } }),
    ]);

    return {
      pending,
      confirmed,
      paid,
      total,
      pendingAmount: pendingAmount._sum.ownerAmount?.toNumber() ?? 0,
      confirmedAmount: confirmedAmount._sum.ownerAmount?.toNumber() ?? 0,
      paidAmount: paidAmount._sum.ownerAmount?.toNumber() ?? 0,
      totalAmount: totalAmount._sum.ownerAmount?.toNumber() ?? 0,
    };
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
});
