import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createLog, diffAndCreateLogs } from "../lib/logs";
import { Prisma } from "@prisma/client";

const trackedFields = [
  "itemName", "totalAmount", "paidAmount",
  "status", "dueDate", "paidDate", "paymentMethod",
] as const;

export const paymentRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      customerId: z.string().optional(),
      leadId: z.string().optional(),
      status: z.enum(["UNPAID", "PARTIAL", "PAID", "REFUNDED"]).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.customerId) where.customerId = input.customerId;
      if (input.leadId) where.leadId = input.leadId;
      if (input.status) where.status = input.status;
      if (input.dateFrom || input.dateTo) {
        where.createdAt = {};
        if (input.dateFrom) where.createdAt.gte = input.dateFrom;
        if (input.dateTo) where.createdAt.lte = input.dateTo;
      }

      const [total, list] = await Promise.all([
        ctx.db.payment.count({ where }),
        ctx.db.payment.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            customer: true,
            lead: { include: { customer: true } },
            createdBy: true,
          },
        }),
      ]);
      return { total, list };
    }),

  byLead: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.db.payment.findMany({
        where: { leadId: input },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      leadId: z.string().optional(),
      itemName: z.string(),
      totalAmount: z.number(),
      paidAmount: z.number().default(0),
      status: z.enum(["UNPAID", "PARTIAL", "PAID", "REFUNDED"]).default("UNPAID"),
      dueDate: z.date().optional(),
      paymentMethod: z.string().optional(),
      remark: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const data: any = {
        ...input,
        status: deriveStatus(input.totalAmount, input.paidAmount, input.status),
        paidDate: input.paidAmount > 0 && input.paidAmount >= input.totalAmount ? new Date() : undefined,
        createdById: ctx.dbUser.id,
      };
      data.totalAmount = new Prisma.Decimal(input.totalAmount);
      data.paidAmount = new Prisma.Decimal(input.paidAmount);
      const payment = await ctx.db.payment.create({ data });

      await createLog(ctx.db, {
        entityType: "Payment",
        entityId: payment.id,
        action: "CREATE",
        operatorId: ctx.dbUser.id,
        detail: `创建回款记录: ${input.itemName}`,
      });

      return payment;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      itemName: z.string().optional(),
      totalAmount: z.number().optional(),
      paidAmount: z.number().optional(),
      status: z.enum(["UNPAID", "PARTIAL", "PAID", "REFUNDED"]).optional(),
      dueDate: z.date().optional(),
      paymentMethod: z.string().optional(),
      remark: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const old = await ctx.db.payment.findUnique({ where: { id: input.id } });
      if (!old) throw new Error("回款记录不存在");

      const { id, ...rest } = input;
      const updateData: any = {};
      for (const [key, value] of Object.entries(rest)) {
        if (value === undefined) continue;
        if ((key === "totalAmount" || key === "paidAmount") && typeof value === "number") {
          updateData[key] = new Prisma.Decimal(value);
        } else {
          updateData[key] = value;
        }
      }
      if (rest.paidAmount !== undefined && rest.totalAmount !== undefined) {
        updateData.status = deriveStatus(rest.totalAmount, rest.paidAmount, rest.status);
        if (rest.paidAmount > 0 && rest.paidAmount >= rest.totalAmount && !old.paidDate) {
          updateData.paidDate = new Date();
        }
      } else if (rest.paidAmount !== undefined) {
        updateData.status = deriveStatus(Number(old.totalAmount), rest.paidAmount, rest.status);
      }

      const updated = await ctx.db.payment.update({
        where: { id },
        data: updateData,
      });

      const logs = diffAndCreateLogs(
        "Payment", id, old, updateData as any, ctx.dbUser.id, trackedFields
      );
      for (const log of logs) await createLog(ctx.db, log);

      return updated;
    }),

  addPayment: protectedProcedure
    .input(z.object({
      id: z.string(),
      amount: z.number().positive(),
      paymentMethod: z.string().optional(),
      remark: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const old = await ctx.db.payment.findUnique({ where: { id: input.id } });
      if (!old) throw new Error("回款记录不存在");

      const newPaid = Number(old.paidAmount) + input.amount;
      const newStatus = deriveStatus(Number(old.totalAmount), newPaid);

      const updated = await ctx.db.payment.update({
        where: { id: input.id },
        data: {
          paidAmount: new Prisma.Decimal(newPaid),
          status: newStatus,
          paidDate: newStatus === "PAID" ? new Date() : old.paidDate,
          paymentMethod: input.paymentMethod ?? old.paymentMethod,
        },
      });

      await createLog(ctx.db, {
        entityType: "Payment",
        entityId: input.id,
        action: "UPDATE",
        fieldName: "paidAmount",
        oldValue: Number(old.paidAmount),
        newValue: newPaid,
        operatorId: ctx.dbUser.id,
        detail: `回款: +${input.amount}元`,
      });

      return updated;
    }),

  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.payment.findMany();

    const totalReceivable = all.reduce((s, p) => s + Number(p.totalAmount), 0);
    const totalReceived = all.reduce((s, p) => s + Number(p.paidAmount), 0);
    const unpaidCount = all.filter((p) => p.status === "UNPAID" || p.status === "PARTIAL").length;

    const byMonth: Record<string, { receivable: number; received: number }> = {};
    for (const p of all) {
      const key = p.createdAt.toISOString().slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { receivable: 0, received: 0 };
      byMonth[key].receivable += Number(p.totalAmount);
      byMonth[key].received += Number(p.paidAmount);
    }

    const byStatus: Record<string, number> = {};
    for (const p of all) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    }

    const overdue = all.filter((p) => {
      if (p.status === "PAID" || p.status === "REFUNDED") return false;
      if (!p.dueDate) return false;
      return p.dueDate < new Date();
    });

    return {
      totalReceivable,
      totalReceived,
      outstanding: totalReceivable - totalReceived,
      collectionRate: totalReceivable ? totalReceived / totalReceivable : 0,
      unpaidCount,
      byMonth,
      byStatus,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, p) => s + (Number(p.totalAmount) - Number(p.paidAmount)), 0),
    };
  }),

  export: protectedProcedure
    .input(z.object({
      status: z.enum(["UNPAID", "PARTIAL", "PAID", "REFUNDED"]).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.status) where.status = input.status;
      if (input.dateFrom || input.dateTo) {
        where.createdAt = {};
        if (input.dateFrom) where.createdAt.gte = input.dateFrom;
        if (input.dateTo) where.createdAt.lte = input.dateTo;
      }

      const data = await ctx.db.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { customer: true, createdBy: true },
      });

      const headers = ["客户", "项目", "应收", "已收", "未收", "状态", "创建人", "创建时间", "到期日"];
      const rows = data.map((p) => [
        p.customer?.name ?? "",
        p.itemName,
        String(p.totalAmount),
        String(p.paidAmount),
        String(Number(p.totalAmount) - Number(p.paidAmount)),
        statusText(p.status),
        p.createdBy?.name ?? "",
        p.createdAt.toISOString().slice(0, 10),
        p.dueDate?.toISOString().slice(0, 10) ?? "",
      ]);

      return {
        headers, rows,
        filename: `payments_${new Date().toISOString().slice(0, 10)}.csv`,
      };
    }),
});

function deriveStatus(total: number, paid: number, inputStatus?: string) {
  if (inputStatus === "REFUNDED") return "REFUNDED";
  if (paid <= 0) return "UNPAID";
  if (paid >= total) return "PAID";
  return "PARTIAL";
}

function statusText(s: string) {
  return { UNPAID: "未付款", PARTIAL: "部分付款", PAID: "已付清", REFUNDED: "已退款" }[s] ?? s;
}
