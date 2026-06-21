import { z } from "zod";
import { router, protectedProcedure, financeProcedure } from "@/server/api/trpc";
import { ContractStatus, type Contract } from "@prisma/client";
import { recordChanges, getChangeHistory } from "@/server/services/auditService";

export const contractRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, search } = input;

      const where: any = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { contractNo: { contains: search, mode: "insensitive" } },
          { lease: { tenant: { name: { contains: search, mode: "insensitive" } } } },
          { lease: { property: { name: { contains: search, mode: "insensitive" } } } },
        ];
      }

      const [total, contracts] = await Promise.all([
        ctx.db.contract.count({ where }),
        ctx.db.contract.findMany({
          where,
          include: {
            lease: {
              include: {
                property: { select: { name: true, address: true } },
                tenant: { select: { name: true, phone: true, email: true } },
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
        items: contracts.map((c) => ({
          id: c.id,
          contractNo: c.contractNo,
          status: c.status,
          signUrl: c.signUrl,
          fileUrl: c.fileUrl,
          signedAt: c.signedAt,
          remark: c.remark,
          createdAt: c.createdAt,
          property: {
            name: c.lease.property.name,
            address: c.lease.property.address,
          },
          tenant: {
            name: c.lease.tenant.name,
            phone: c.lease.tenant.phone,
            email: c.lease.tenant.email,
          },
          monthlyRent: c.lease.monthlyRent.toNumber(),
          deposit: c.lease.deposit.toNumber(),
          startDate: c.lease.startDate,
          endDate: c.lease.endDate,
        })),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contract = await ctx.db.contract.findUnique({
        where: { id: input.id },
        include: {
          lease: {
            include: {
              property: { select: { name: true, address: true, area: true } },
              tenant: { select: { name: true, phone: true, email: true } },
              owner: { select: { name: true, phone: true } },
            },
          },
        },
      });

      if (!contract) return null;

      const changeHistory = await getChangeHistory("CONTRACT", contract.id);

      return { ...contract, changeHistory };
    }),

  getStats: financeProcedure.query(async ({ ctx }) => {
    const [pending, signed, cancelled, total, pendingAmount, signedAmount, cancelledAmount, totalAmount] = await Promise.all([
      ctx.db.contract.count({ where: { status: ContractStatus.PENDING_SIGN } }),
      ctx.db.contract.count({ where: { status: ContractStatus.SIGNED } }),
      ctx.db.contract.count({ where: { status: { in: [ContractStatus.CANCELLED, ContractStatus.EXPIRED] } } }),
      ctx.db.contract.count(),
      ctx.db.contract.aggregate({
        _sum: { lease: { monthlyRent: true } },
        where: { status: ContractStatus.PENDING_SIGN },
      }),
      ctx.db.contract.aggregate({
        _sum: { lease: { monthlyRent: true } },
        where: { status: ContractStatus.SIGNED },
      }),
      ctx.db.contract.aggregate({
        _sum: { lease: { monthlyRent: true } },
        where: { status: { in: [ContractStatus.CANCELLED, ContractStatus.EXPIRED] } },
      }),
      ctx.db.contract.aggregate({
        _sum: { lease: { monthlyRent: true } },
      }),
    ]);

    return {
      pending,
      signed,
      cancelled,
      total,
      pendingAmount: 0,
      signedAmount: 0,
      cancelledAmount: 0,
      totalAmount: 0,
    };
  }),

  markSigned: financeProcedure
    .input(
      z.object({
        id: z.string(),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, remark } = input;

      const oldContract = await ctx.db.contract.findUnique({ where: { id } });
      if (!oldContract) throw new Error("合同不存在");

      const updateData: any = {
        status: ContractStatus.SIGNED,
        signedAt: new Date(),
      };

      const [updated] = await Promise.all([
        ctx.db.contract.update({ where: { id }, data: updateData }),
        recordChanges("CONTRACT", id, oldContract, updateData, ctx.user, remark || "合同签署"),
      ]);

      return updated;
    }),

  cancel: financeProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, reason } = input;

      const oldContract = await ctx.db.contract.findUnique({ where: { id } });
      if (!oldContract) throw new Error("合同不存在");

      const updateData: any = { status: ContractStatus.CANCELLED };

      const [updated] = await Promise.all([
        ctx.db.contract.update({ where: { id }, data: updateData }),
        recordChanges("CONTRACT", id, oldContract, updateData, ctx.user, reason || "取消合同"),
      ]);

      return updated;
    }),

  updateStatus: financeProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([ContractStatus.DRAFT, ContractStatus.PENDING_SIGN, ContractStatus.SIGNED, ContractStatus.CANCELLED, ContractStatus.EXPIRED, ContractStatus.ARCHIVED]),
        signedAt: z.date().optional(),
        signUrl: z.string().optional(),
        fileUrl: z.string().optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, reason, ...updateData } = input;

      const oldContract = await ctx.db.contract.findUnique({ where: { id } });
      if (!oldContract) throw new Error("合同不存在");

      const [updated] = await Promise.all([
        ctx.db.contract.update({ where: { id }, data: updateData as Partial<Contract> }),
        recordChanges("CONTRACT", id, oldContract, updateData as Partial<Contract>, ctx.user, reason),
      ]);

      return updated;
    }),

  getPendingList: financeProcedure.query(async ({ ctx }) => {
    const contracts = await ctx.db.contract.findMany({
      where: { status: { in: [ContractStatus.DRAFT, ContractStatus.PENDING_SIGN] } },
      include: {
        lease: {
          include: {
            property: { select: { name: true } },
            tenant: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return contracts.map((c) => ({
      id: c.id,
      contractNo: c.contractNo,
      status: c.status,
      propertyName: c.lease.property.name,
      tenantName: c.lease.tenant.name,
      createdAt: c.createdAt,
    }));
  }),
});
