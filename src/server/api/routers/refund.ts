import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { RefundStatus } from "@prisma/client";
import { logCreate, logApprove, logReject, logRefund } from "@/lib/audit-log";
import { notifyRefundUpdate } from "@/lib/notifications";

export const refundRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        repairRequestId: z.string(),
        amount: z.number().positive("金额必须大于0"),
        reason: z.string().min(1, "退款原因不能为空"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const repair = await ctx.prisma.repairRequest.findUnique({
        where: { id: input.repairRequestId },
      });

      if (!repair) {
        throw new Error("报修单不存在");
      }

      if (repair.reportedById !== ctx.userId && ctx.user.role === "STUDENT") {
        throw new Error("无权限申请此报修单的退款");
      }

      const existingRefund = await ctx.prisma.refund.findFirst({
        where: {
          repairRequestId: input.repairRequestId,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });

      if (existingRefund) {
        throw new Error("该报修单已有待处理或已批准的退款申请");
      }

      const refund = await ctx.prisma.refund.create({
        data: {
          ...input,
          requestedById: ctx.userId,
        },
      });

      await logCreate(
        "Refund",
        refund.id,
        ctx.userId,
        input,
        `${ctx.user.name} 申请退款 ¥${input.amount}`,
        input.repairRequestId
      );

      return refund;
    }),

  process: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([RefundStatus.APPROVED, RefundStatus.REJECTED]),
        notes: z.string().optional(),
        transactionId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.refund.findUnique({
        where: { id: input.id },
        include: {
          requestedBy: true,
          repairRequest: true,
        },
      });

      if (!existing) {
        throw new Error("退款申请不存在");
      }

      if (existing.status !== "PENDING") {
        throw new Error("该退款申请已被处理");
      }

      const updated = await ctx.prisma.refund.update({
        where: { id: input.id },
        data: {
          status: input.status,
          processedById: ctx.userId,
          processedAt: new Date(),
          notes: input.notes,
          transactionId: input.transactionId,
        },
      });

      if (input.status === "APPROVED") {
        await logApprove(
          "Refund",
          input.id,
          ctx.userId,
          `${ctx.user.name} 批准了退款 ¥${existing.amount}`,
          existing.repairRequestId
        );
        await logRefund(
          "Refund",
          input.id,
          ctx.userId,
          existing.amount.toNumber(),
          `退款处理完成，交易号: ${input.transactionId || "无"}`,
          existing.repairRequestId
        );
      } else {
        await logReject(
          "Refund",
          input.id,
          ctx.userId,
          `${ctx.user.name} 拒绝了退款申请: ${input.notes || "无备注"}`,
          existing.repairRequestId
        );
      }

      await notifyRefundUpdate(
        input.id,
        existing.requestedById,
        input.status
      );

      return updated;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const refund = await ctx.prisma.refund.findUnique({
        where: { id: input.id },
        include: {
          requestedBy: { select: { id: true, name: true, email: true } },
          processedBy: { select: { id: true, name: true, role: true } },
          repairRequest: {
            select: { id: true, title: true, status: true, actualCost: true },
          },
          auditLogs: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!refund) return null;

      if (
        refund.requestedById !== ctx.userId &&
        ctx.user.role === "STUDENT"
      ) {
        return null;
      }

      return refund;
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        status: z.nativeEnum(RefundStatus).optional(),
        search: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        mineOnly: z.boolean().default(false),
        sortBy: z.enum(["createdAt", "updatedAt", "status", "amount"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.status) where.status = input.status;
      if (input.dateFrom) where.createdAt = { ...where.createdAt, gte: input.dateFrom };
      if (input.dateTo) where.createdAt = { ...where.createdAt, lte: input.dateTo };
      if (input.mineOnly) where.requestedById = ctx.userId;
      if (input.search) {
        where.OR = [
          { reason: { contains: input.search } },
          { repairRequest: { title: { contains: input.search } } },
        ];
      }

      const skip = (input.page - 1) * input.pageSize;
      const take = input.pageSize;

      const [items, total, totalAmount] = await Promise.all([
        ctx.prisma.refund.findMany({
          where,
          include: {
            requestedBy: { select: { id: true, name: true } },
            processedBy: { select: { id: true, name: true } },
            repairRequest: { select: { id: true, title: true } },
          },
          skip,
          take,
          orderBy: { [input.sortBy]: input.sortOrder },
        }),
        ctx.prisma.refund.count({ where }),
        ctx.prisma.refund.aggregate({
          where: { ...where, status: "COMPLETED" },
          _sum: { amount: true },
        }),
      ]);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
        totalCompletedAmount: totalAmount._sum.amount?.toNumber() || 0,
      };
    }),
});
