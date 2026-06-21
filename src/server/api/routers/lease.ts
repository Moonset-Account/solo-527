import { z } from "zod";
import { router, protectedProcedure, financeProcedure, auditedProcedure } from "@/server/api/trpc";
import { LeaseStatus, type Lease } from "@prisma/client";
import { recordChanges, getChangeHistory } from "@/server/services/auditService";

export const leaseRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.enum([LeaseStatus.ACTIVE, LeaseStatus.EXPIRED, LeaseStatus.PENDING, LeaseStatus.TERMINATED]).optional(),
        tenantName: z.string().optional(),
        propertyName: z.string().optional(),
        ownerName: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, tenantName, propertyName, ownerName } = input;

      const where = {} as any;
      if (status) where.status = status;
      if (tenantName) where.tenant = { name: { contains: tenantName, mode: "insensitive" } };
      if (propertyName) where.property = { name: { contains: propertyName, mode: "insensitive" } };
      if (ownerName) where.owner = { name: { contains: ownerName, mode: "insensitive" } };

      const [total, leases] = await Promise.all([
        ctx.db.lease.count({ where }),
        ctx.db.lease.findMany({
          where,
          include: {
            property: { select: { name: true, address: true } },
            tenant: { select: { name: true, phone: true, company: true } },
            owner: { select: { name: true, phone: true } },
            _count: {
              select: {
                bills: true,
                assignments: true,
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
        leases: leases.map((lease) => ({
          id: lease.id,
          propertyName: lease.property.name,
          propertyAddress: lease.property.address,
          tenantName: lease.tenant.name,
          tenantPhone: lease.tenant.phone,
          tenantCompany: lease.tenant.company,
          ownerName: lease.owner.name,
          ownerPhone: lease.owner.phone,
          monthlyRent: lease.monthlyRent.toNumber(),
          deposit: lease.deposit.toNumber(),
          startDate: lease.startDate,
          endDate: lease.endDate,
          paymentDay: lease.paymentDay,
          status: lease.status,
          billCount: lease._count.bills,
          assignmentCount: lease._count.assignments,
        })),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const lease = await ctx.db.lease.findUnique({
        where: { id: input.id },
        include: {
          property: { select: { name: true, address: true } },
          tenant: { select: { name: true, phone: true, email: true, company: true } },
          owner: { select: { name: true, phone: true, email: true } },
          bills: {
            orderBy: { dueDate: "desc" },
            take: 10,
            include: { exception: true },
          },
          assignments: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { assignee: { select: { name: true } } },
          },
          contracts: { orderBy: { createdAt: "desc" } },
          settlements: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      });

      if (!lease) return null;

      const changeHistory = await getChangeHistory("LEASE", lease.id);

      return {
        id: lease.id,
        property: lease.property,
        tenant: lease.tenant,
        owner: lease.owner,
        monthlyRent: lease.monthlyRent.toNumber(),
        deposit: lease.deposit.toNumber(),
        startDate: lease.startDate,
        endDate: lease.endDate,
        paymentDay: lease.paymentDay,
        status: lease.status,
        remark: lease.remark,
        bills: lease.bills.map((b) => ({
          id: b.id,
          billNo: b.billNo,
          period: b.period,
          amount: b.amount.toNumber(),
          paidAmount: b.paidAmount.toNumber(),
          dueDate: b.dueDate,
          paidDate: b.paidDate,
          status: b.status,
          hasException: !!b.exception,
        })),
        assignments: lease.assignments.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          priority: a.priority,
          status: a.status,
          assigneeName: a.assignee.name,
          createdAt: a.createdAt,
        })),
        contracts: lease.contracts,
        settlements: lease.settlements.map((s) => ({
          id: s.id,
          settlementNo: s.settlementNo,
          periodFrom: s.periodFrom,
          periodTo: s.periodTo,
          totalRent: s.totalRent.toNumber(),
          ownerAmount: s.ownerAmount.toNumber(),
          status: s.status,
        })),
        changeHistory,
      };
    }),

  update: auditedProcedure
    .input(
      z.object({
        id: z.string(),
        monthlyRent: z.number().optional(),
        deposit: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        paymentDay: z.number().optional(),
        status: z.enum([LeaseStatus.ACTIVE, LeaseStatus.EXPIRED, LeaseStatus.PENDING, LeaseStatus.TERMINATED]).optional(),
        remark: z.string().optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, reason, ...updateData } = input;

      const oldLease = await ctx.db.lease.findUnique({ where: { id } });
      if (!oldLease) throw new Error("租约不存在");

      const updatePayload = {
        ...updateData,
      } as Partial<Lease>;

      const [updatedLease] = await Promise.all([
        ctx.db.lease.update({ where: { id }, data: updatePayload }),
        recordChanges("LEASE", id, oldLease, updatePayload, ctx.user, reason),
      ]);

      return updatedLease;
    }),

  search: protectedProcedure
    .input(z.object({ keyword: z.string() }))
    .query(async ({ ctx, input }) => {
      const leases = await ctx.db.lease.findMany({
        where: {
          OR: [
            { property: { name: { contains: input.keyword, mode: "insensitive" } } },
            { tenant: { name: { contains: input.keyword, mode: "insensitive" } } },
            { tenant: { phone: { contains: input.keyword } } },
            { owner: { name: { contains: input.keyword, mode: "insensitive" } } },
          ],
        },
        include: {
          property: { select: { name: true } },
          tenant: { select: { name: true } },
          owner: { select: { name: true } },
        },
        take: 20,
      });

      return leases.map((l) => ({
        id: l.id,
        label: `${l.property.name} - ${l.tenant.name}`,
        propertyName: l.property.name,
        tenantName: l.tenant.name,
        ownerName: l.owner.name,
        status: l.status,
      }));
    }),
});
