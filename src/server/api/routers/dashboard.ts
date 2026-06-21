import { z } from "zod";
import { router, protectedProcedure } from "@/server/api/trpc";
import { BillStatus, AssignmentStatus } from "@prisma/client";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();

    const [totalLeases, activeLeases, totalBills, paidBills, overdueBills, pendingAssignments, myAssignments] =
      await Promise.all([
        ctx.db.lease.count(),
        ctx.db.lease.count({ where: { status: "ACTIVE" } }),
        ctx.db.bill.count(),
        ctx.db.bill.count({ where: { status: BillStatus.PAID } }),
        ctx.db.bill.count({ where: { OR: [{ status: BillStatus.OVERDUE }, { status: BillStatus.EXCEPTION }] } }),
        ctx.db.assignment.count({ where: { status: { in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS] } } }),
        ctx.db.assignment.count({
          where: { assigneeId: ctx.user.id, status: { in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS] } },
        }),
      ]);

    const totalAmount = await ctx.db.bill.aggregate({
      _sum: { amount: true },
      where: { status: BillStatus.PAID },
    });

    const overdueAmount = await ctx.db.bill.aggregate({
      _sum: { amount: true },
      where: { OR: [{ status: BillStatus.OVERDUE }, { status: BillStatus.EXCEPTION }] },
    });

    return {
      totalLeases,
      activeLeases,
      totalBills,
      paidBills,
      overdueBills,
      pendingAssignments,
      myAssignments,
      totalCollected: totalAmount._sum.amount?.toNumber() ?? 0,
      overdueAmount: overdueAmount._sum.amount?.toNumber() ?? 0,
      collectionRate: totalBills > 0 ? Math.round((paidBills / totalBills) * 100) : 0,
    };
  }),

  getOverdueList: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const bills = await ctx.db.bill.findMany({
        where: { OR: [{ status: BillStatus.OVERDUE }, { status: BillStatus.EXCEPTION }] },
        include: {
          lease: {
            include: {
              property: { select: { name: true, address: true } },
              tenant: { select: { name: true, phone: true } },
            },
          },
          exception: true,
        },
        orderBy: { dueDate: "asc" },
        take: input.limit,
      });

      return bills.map((bill) => ({
        id: bill.id,
        billNo: bill.billNo,
        period: bill.period,
        amount: bill.amount.toNumber(),
        dueDate: bill.dueDate,
        status: bill.status,
        propertyName: bill.lease.property.name,
        tenantName: bill.lease.tenant.name,
        tenantPhone: bill.lease.tenant.phone,
        overdueDays: Math.floor((Date.now() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
        exception: bill.exception,
      }));
    }),

  getCollectionTrend: protectedProcedure.query(async ({ ctx }) => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      months.push({
        month,
        label: format(month, "MM月", { locale: zhCN }),
        start: startOfMonth(month),
        end: endOfMonth(month),
      });
    }

    const data = await Promise.all(
      months.map(async ({ month, label, start, end }) => {
        const [paid, unpaid] = await Promise.all([
          ctx.db.bill.aggregate({
            _sum: { amount: true },
            where: {
              status: BillStatus.PAID,
              paidDate: { gte: start, lte: end },
            },
          }),
          ctx.db.bill.aggregate({
            _sum: { amount: true },
            where: {
              status: { not: BillStatus.PAID },
              dueDate: { gte: start, lte: end },
            },
          }),
        ]);

        return {
          month: label,
          paid: paid._sum.amount?.toNumber() ?? 0,
          unpaid: unpaid._sum.amount?.toNumber() ?? 0,
        };
      })
    );

    return data;
  }),

  getTodoList: protectedProcedure.query(async ({ ctx }) => {
    const assignments = await ctx.db.assignment.findMany({
      where: {
        OR: [
          { assigneeId: ctx.user.id, status: { in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS] } },
          ...(ctx.user.role === "ADMIN" ? [{ status: AssignmentStatus.PENDING }] : []),
        ],
      },
      include: {
        assignee: { select: { name: true } },
        lease: {
          include: {
            property: { select: { name: true } },
            tenant: { select: { name: true } },
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 10,
    });

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      priority: a.priority,
      status: a.status,
      assigneeName: a.assignee.name,
      propertyName: a.lease.property.name,
      tenantName: a.lease.tenant.name,
      createdAt: a.createdAt,
    }));
  }),
});
