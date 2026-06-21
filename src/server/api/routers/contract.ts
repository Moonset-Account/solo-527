import { z } from "zod";
import { router, protectedProcedure, financeProcedure, auditedProcedure } from "@/server/api/trpc";
import { ContractStatus, type Contract } from "@prisma/client";
import { recordChanges, getChangeHistory } from "@/server/services/auditService";

export const contractRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.array(z.enum([ContractStatus.DRAFT, ContractStatus.PENDING_SIGN, ContractStatus.SIGNED, ContractStatus.ARCHIVED])).optional(),
        tenantName: z.string().optional(),
        propertyName: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, tenantName, propertyName } = input;

      const where: any = {};
      if (status?.length) where.status = { in: status };
      if (tenantName) where.lease = { tenant: { name: { contains: tenantName, mode: "insensitive" } } };
      if (propertyName) where.lease = { ...where.lease, property: { name: { contains: propertyName, mode: "insensitive" } } };

      const [total, contracts] = await Promise.all([
        ctx.db.contract.count({ where }),
        ctx.db.contract.findMany({
          where,
          include: {
            lease: {
              include: {
                property: { select: { name: true } },
                tenant: { select: { name: true, phone: true } },
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
        contracts: contracts.map((c) => ({
          id: c.id,
          contractNo: c.contractNo,
          status: c.status,
          signUrl: c.signUrl,
          fileUrl: c.fileUrl,
          signedAt: c.signedAt,
          remark: c.remark,
          propertyName: c.lease.property.name,
          tenantName: c.lease.tenant.name,
          tenantPhone: c.lease.tenant.phone,
          createdAt: c.createdAt,
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
              property: { select: { name: true, address: true } },
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

  updateStatus: financeProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([ContractStatus.DRAFT, ContractStatus.PENDING_SIGN, ContractStatus.SIGNED, ContractStatus.ARCHIVED]),
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
