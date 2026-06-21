import { z } from "zod";
import { router, protectedProcedure, financeProcedure, auditedProcedure } from "@/server/api/trpc";
import { BillStatus, ExceptionLevel, ExceptionStatus, ExceptionType, AssignmentType, AssignmentStatus, Priority, type Bill } from "@prisma/client";
import { recordChanges, getChangeHistory } from "@/server/services/auditService";

export const billRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.array(z.enum([BillStatus.UNPAID, BillStatus.PARTIAL, BillStatus.PAID, BillStatus.OVERDUE, BillStatus.EXCEPTION])).optional(),
        periodFrom: z.string().optional(),
        periodTo: z.string().optional(),
        tenantName: z.string().optional(),
        propertyName: z.string().optional(),
        minAmount: z.number().optional(),
        maxAmount: z.number().optional(),
        isOverdue: z.boolean().optional(),
        leaseId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, periodFrom, periodTo, tenantName, propertyName, minAmount, maxAmount, isOverdue, leaseId } = input;

      const where: any = {};
      if (status?.length) where.status = { in: status };
      if (leaseId) where.leaseId = leaseId;
      if (tenantName) where.lease = { tenant: { name: { contains: tenantName, mode: "insensitive" } } };
      if (propertyName) where.lease = { ...where.lease, property: { name: { contains: propertyName, mode: "insensitive" } } };
      if (minAmount) where.amount = { ...where.amount, gte: minAmount };
      if (maxAmount) where.amount = { ...where.amount, lte: maxAmount };
      if (periodFrom || periodTo) {
        where.dueDate = {};
        if (periodFrom) where.dueDate.gte = new Date(periodFrom);
        if (periodTo) where.dueDate.lte = new Date(periodTo);
      }
      if (isOverdue !== undefined) {
        if (isOverdue) {
          where.OR = [{ status: BillStatus.OVERDUE }, { status: BillStatus.EXCEPTION }];
        }
      }

      const [total, bills] = await Promise.all([
        ctx.db.bill.count({ where }),
        ctx.db.bill.findMany({
          where,
          include: {
            lease: {
              include: {
                property: { select: { name: true, address: true } },
                tenant: { select: { name: true, phone: true } },
                owner: { select: { name: true } },
              },
            },
            exception: true,
          },
          orderBy: { dueDate: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        bills: bills.map((bill) => {
          const overdueDays = bill.status === BillStatus.OVERDUE || bill.status === BillStatus.EXCEPTION
            ? Math.floor((Date.now() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          return {
            id: bill.id,
            billNo: bill.billNo,
            period: bill.period,
            amount: bill.amount.toNumber(),
            paidAmount: bill.paidAmount.toNumber(),
            dueDate: bill.dueDate,
            paidDate: bill.paidDate,
            status: bill.status,
            propertyName: bill.lease.property.name,
            tenantName: bill.lease.tenant.name,
            tenantPhone: bill.lease.tenant.phone,
            ownerName: bill.lease.owner.name,
            overdueDays,
            hasException: !!bill.exception,
            exceptionLevel: bill.exception?.level,
            exceptionStatus: bill.exception?.status,
            paymentMethod: bill.paymentMethod,
          };
        }),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const bill = await ctx.db.bill.findUnique({
        where: { id: input.id },
        include: {
          lease: {
            include: {
              property: { select: { name: true, address: true } },
              tenant: { select: { name: true, phone: true, email: true, company: true } },
              owner: { select: { name: true, phone: true, email: true } },
            },
          },
          exception: true,
          assignments: {
            include: { assignee: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!bill) return null;

      const changeHistory = await getChangeHistory("BILL", bill.id);
      const overdueDays = bill.status === BillStatus.OVERDUE || bill.status === BillStatus.EXCEPTION
        ? Math.floor((Date.now() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: bill.id,
        billNo: bill.billNo,
        period: bill.period,
        amount: bill.amount.toNumber(),
        paidAmount: bill.paidAmount.toNumber(),
        dueDate: bill.dueDate,
        paidDate: bill.paidDate,
        status: bill.status,
        overdueDays,
        paymentMethod: bill.paymentMethod,
        remark: bill.remark,
        lease: bill.lease,
        exception: bill.exception,
        assignments: bill.assignments,
        changeHistory,
      };
    }),

  pay: auditedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number(),
        paymentMethod: z.string(),
        paidDate: z.date().default(() => new Date()),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount, paymentMethod, paidDate, reason } = input;

      const oldBill = await ctx.db.bill.findUnique({ where: { id } });
      if (!oldBill) throw new Error("账单不存在");

      const newPaidAmount = oldBill.paidAmount.toNumber() + amount;
      const totalAmount = oldBill.amount.toNumber();

      let newStatus = oldBill.status;
      if (newPaidAmount >= totalAmount) {
        newStatus = BillStatus.PAID;
      } else if (newPaidAmount > 0) {
        newStatus = BillStatus.PARTIAL;
      }

      const updateData = {
        paidAmount: newPaidAmount,
        paidDate,
        status: newStatus,
        paymentMethod,
      };

      const [updatedBill] = await Promise.all([
        ctx.db.bill.update({ where: { id }, data: updateData as Partial<Bill> }),
        recordChanges("BILL", id, oldBill, updateData as Partial<Bill>, ctx.user, reason || "收款登记"),
      ]);

      return updatedBill;
    }),

  generateException: financeProcedure
    .input(
      z.object({
        billId: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const bill = await ctx.db.bill.findUnique({ where: { id: input.billId } });
      if (!bill) throw new Error("账单不存在");
      if (bill.exceptionId) throw new Error("该账单已存在异常单");

      const overdueDays = Math.floor((Date.now() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const level = overdueDays > 30 ? ExceptionLevel.CRITICAL : overdueDays > 7 ? ExceptionLevel.SERIOUS : ExceptionLevel.NORMAL;

      return ctx.db.$transaction(async (tx) => {
        const exception = await tx.exceptionOrder.create({
          data: {
            billId: input.billId,
            type: ExceptionType.OVERDUE,
            level,
            status: ExceptionStatus.OPEN,
            description: input.description,
          },
        });

        await tx.bill.update({
          where: { id: input.billId },
          data: { exceptionId: exception.id, status: BillStatus.EXCEPTION },
        });

        const frontlineUser = await tx.user.findFirst({ where: { role: "FRONTLINE" } });
        if (frontlineUser) {
          await tx.assignment.create({
            data: {
              leaseId: bill.leaseId,
              billId: input.billId,
              type: AssignmentType.COLLECTION,
              priority: Priority.HIGH,
              assigneeId: frontlineUser.id,
              title: `租金逾期催收 - 账单${bill.billNo}`,
              description: input.description,
              status: AssignmentStatus.PENDING,
            },
          });
        }

        return exception;
      });
    }),

  getByLeaseId: protectedProcedure
    .input(z.object({ leaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const bills = await ctx.db.bill.findMany({
        where: { leaseId: input.leaseId },
        orderBy: { dueDate: "desc" },
      });

      return bills.map((b) => ({
        id: b.id,
        billNo: b.billNo,
        period: b.period,
        amount: b.amount.toNumber(),
        paidAmount: b.paidAmount.toNumber(),
        dueDate: b.dueDate,
        status: b.status,
      }));
    }),
});
