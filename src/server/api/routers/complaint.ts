import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { ComplaintStatus } from "@prisma/client";
import { logCreate, logUpdate, createAuditLog, logApprove, logReject } from "@/lib/audit-log";
import { notifyComplaintUpdate } from "@/lib/notifications";
import { LogAction } from "@prisma/client";

export const complaintRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "标题不能为空").max(200),
        description: z.string().min(1, "描述不能为空"),
        repairRequestId: z.string().optional(),
        tradeId: z.string().optional(),
        attachmentIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.repairRequestId && !input.tradeId) {
        throw new Error("必须关联报修单或交易");
      }

      const complaint = await ctx.prisma.complaint.create({
        data: {
          title: input.title,
          description: input.description,
          repairRequestId: input.repairRequestId,
          tradeId: input.tradeId,
          submittedById: ctx.userId,
        },
      });

      if (input.attachmentIds && input.attachmentIds.length > 0) {
        await ctx.prisma.attachment.updateMany({
          where: { id: { in: input.attachmentIds } },
          data: { complaintId: complaint.id },
        });
      }

      await logCreate(
        "Complaint",
        complaint.id,
        ctx.userId,
        input,
        `${ctx.user.name} 提交了举报: ${input.title}`,
        input.repairRequestId
      );

      return complaint;
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ComplaintStatus),
        response: z.string().min(1, "回复内容不能为空"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.complaint.findUnique({
        where: { id: input.id },
        include: { submittedBy: true },
      });

      if (!existing) {
        throw new Error("举报不存在");
      }

      const updated = await ctx.prisma.complaint.update({
        where: { id: input.id },
        data: {
          status: input.status,
          response: input.response,
          respondedById: ctx.userId,
          respondedAt: new Date(),
        },
      });

      if (input.status === "RESOLVED") {
        await logApprove(
          "Complaint",
          input.id,
          ctx.userId,
          `${ctx.user.name} 解决了举报: ${existing.title}`,
          existing.repairRequestId || undefined
        );
      } else if (input.status === "DISMISSED") {
        await logReject(
          "Complaint",
          input.id,
          ctx.userId,
          `${ctx.user.name} 驳回了举报: ${existing.title}`,
          existing.repairRequestId || undefined
        );
      } else {
        await logUpdate(
          "Complaint",
          input.id,
          ctx.userId,
          existing,
          { status: input.status, response: input.response },
          `${ctx.user.name} 更新了举报状态`,
          existing.repairRequestId || undefined
        );
      }

      await notifyComplaintUpdate(
        input.id,
        existing.submittedById,
        input.status
      );

      return updated;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const complaint = await ctx.prisma.complaint.findUnique({
        where: { id: input.id },
        include: {
          submittedBy: { select: { id: true, name: true, email: true } },
          respondedBy: { select: { id: true, name: true, role: true } },
          repairRequest: {
            select: { id: true, title: true, status: true },
          },
          trade: {
            select: { id: true, title: true, status: true },
          },
          attachments: true,
          auditLogs: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!complaint) return null;

      if (
        complaint.submittedById !== ctx.userId &&
        ctx.user.role === "STUDENT"
      ) {
        return null;
      }

      return complaint;
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        status: z.nativeEnum(ComplaintStatus).optional(),
        search: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        mineOnly: z.boolean().default(false),
        sortBy: z.enum(["createdAt", "updatedAt", "status"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.status) where.status = input.status;
      if (input.dateFrom) where.createdAt = { ...where.createdAt, gte: input.dateFrom };
      if (input.dateTo) where.createdAt = { ...where.createdAt, lte: input.dateTo };
      if (input.mineOnly) where.submittedById = ctx.userId;
      if (input.search) {
        where.OR = [
          { title: { contains: input.search } },
          { description: { contains: input.search } },
        ];
      }

      const skip = (input.page - 1) * input.pageSize;
      const take = input.pageSize;

      const [items, total] = await Promise.all([
        ctx.prisma.complaint.findMany({
          where,
          include: {
            submittedBy: { select: { id: true, name: true } },
            respondedBy: { select: { id: true, name: true } },
            repairRequest: { select: { id: true, title: true } },
            trade: { select: { id: true, title: true } },
            _count: { select: { attachments: true } },
          },
          skip,
          take,
          orderBy: { [input.sortBy]: input.sortOrder },
        }),
        ctx.prisma.complaint.count({ where }),
      ]);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),
});
