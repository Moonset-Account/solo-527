import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { TradeStatus } from "@prisma/client";
import { logCreate, logUpdate, createAuditLog, logApprove } from "@/lib/audit-log";
import { notifyTradeUpdate } from "@/lib/notifications";
import { LogAction } from "@prisma/client";

export const tradeRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "标题不能为空").max(200),
        description: z.string().min(1, "描述不能为空"),
        price: z.number().min(0, "价格不能为负数"),
        category: z.string().min(1),
        condition: z.string().min(1),
        photoIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const trade = await ctx.prisma.trade.create({
        data: {
          title: input.title,
          description: input.description,
          price: input.price,
          category: input.category,
          condition: input.condition,
          sellerId: ctx.userId,
        },
      });

      if (input.photoIds && input.photoIds.length > 0) {
        await ctx.prisma.attachment.updateMany({
          where: { id: { in: input.photoIds } },
          data: { tradeId: trade.id },
        });
      }

      await logCreate(
        "Trade",
        trade.id,
        ctx.userId,
        input,
        `${ctx.user.name} 发布了二手商品: ${input.title}`
      );

      await ctx.prisma.activityParticipation.create({
        data: {
          userId: ctx.userId,
          activityName: "发布二手商品",
          activityType: "TRADE_CREATE",
          tradeId: trade.id,
          points: 3,
        },
      });

      return trade;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(TradeStatus),
        buyerId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.trade.findUnique({
        where: { id: input.id },
        include: { seller: true, buyer: true },
      });

      if (!existing) {
        throw new Error("交易不存在");
      }

      const isSeller = existing.sellerId === ctx.userId;
      const isBuyer = existing.buyerId === ctx.userId;
      const isAdmin = ctx.user.role !== "STUDENT";

      if (!isSeller && !isBuyer && !isAdmin) {
        throw new Error("无权限修改此交易状态");
      }

      if (input.status === "IN_PROGRESS" && !input.buyerId && !isBuyer) {
        throw new Error("需要指定买家");
      }

      const oldStatus = existing.status;

      const data: any = { status: input.status };
      if (input.buyerId && input.status === "IN_PROGRESS") {
        data.buyerId = input.buyerId;
      }

      const updated = await ctx.prisma.trade.update({
        where: { id: input.id },
        data,
      });

      await createAuditLog({
        action: LogAction.STATUS_CHANGE,
        entityType: "Trade",
        entityId: input.id,
        userId: ctx.userId,
        oldValue: { status: oldStatus },
        newValue: { status: input.status },
        description: `${ctx.user.name} 将交易状态从 ${oldStatus} 变更为 ${input.status}`,
        tradeId: input.id,
      });

      if (isSeller && existing.buyerId) {
        await notifyTradeUpdate(input.id, existing.buyerId, input.status);
      }
      if ((isBuyer || input.buyerId) && existing.sellerId) {
        await notifyTradeUpdate(input.id, existing.sellerId, input.status);
      }

      if (input.status === "COMPLETED") {
        await ctx.prisma.activityParticipation.create({
          data: {
            userId: existing.sellerId,
            activityName: "完成交易",
            activityType: "TRADE_COMPLETE",
            tradeId: input.id,
            points: 10,
          },
        });
        if (existing.buyerId || input.buyerId) {
          await ctx.prisma.activityParticipation.create({
            data: {
              userId: input.buyerId || existing.buyerId!,
              activityName: "完成交易",
              activityType: "TRADE_COMPLETE",
              tradeId: input.id,
              points: 10,
            },
          });
        }
      }

      return updated;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.trade.findUnique({
        where: { id: input.id },
        include: {
          seller: { select: { id: true, name: true, email: true, dormNumber: true } },
          buyer: { select: { id: true, name: true, email: true, dormNumber: true } },
          photos: true,
          comments: {
            include: {
              author: { select: { id: true, name: true, role: true } },
              attachments: true,
            },
            orderBy: { createdAt: "desc" },
          },
          repairRequests: {
            select: { id: true, title: true, status: true, createdAt: true },
          },
          complaints: {
            select: { id: true, title: true, status: true, description: true, createdAt: true },
          },
          auditLogs: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          activities: {
            include: {
              user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        status: z.nativeEnum(TradeStatus).optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        mineOnly: z.boolean().default(false),
        sortBy: z.enum(["createdAt", "updatedAt", "price", "status"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.status) where.status = input.status;
      if (input.category) where.category = input.category;
      if (input.priceMin !== undefined) where.price = { ...where.price, gte: input.priceMin };
      if (input.priceMax !== undefined) where.price = { ...where.price, lte: input.priceMax };
      if (input.dateFrom) where.createdAt = { ...where.createdAt, gte: input.dateFrom };
      if (input.dateTo) where.createdAt = { ...where.createdAt, lte: input.dateTo };
      if (input.mineOnly) {
        where.OR = [
          { sellerId: ctx.userId },
          { buyerId: ctx.userId },
        ];
      }
      if (input.search) {
        where.OR = [
          ...(where.OR || []),
          { title: { contains: input.search } },
          { description: { contains: input.search } },
          { seller: { name: { contains: input.search } } },
        ];
      }

      const skip = (input.page - 1) * input.pageSize;
      const take = input.pageSize;

      const [items, total] = await Promise.all([
        ctx.prisma.trade.findMany({
          where,
          include: {
            seller: { select: { id: true, name: true, dormNumber: true } },
            buyer: { select: { id: true, name: true } },
            _count: { select: { photos: true, comments: true } },
          },
          skip,
          take,
          orderBy: { [input.sortBy]: input.sortOrder },
        }),
        ctx.prisma.trade.count({ where }),
      ]);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        tradeId: z.string(),
        content: z.string().min(1),
        attachmentIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.create({
        data: {
          content: input.content,
          tradeId: input.tradeId,
          authorId: ctx.userId,
        },
      });

      if (input.attachmentIds && input.attachmentIds.length > 0) {
        await ctx.prisma.attachment.updateMany({
          where: { id: { in: input.attachmentIds } },
          data: { commentId: comment.id },
        });
      }

      await logCreate(
        "Comment",
        comment.id,
        ctx.userId,
        { content: input.content },
        `${ctx.user.name} 评论了交易`
      );

      return comment;
    }),

  linkToRepair: protectedProcedure
    .input(
      z.object({
        tradeId: z.string(),
        repairRequestId: z.string(),
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
        throw new Error("无权限关联此报修单");
      }

      const updated = await ctx.prisma.repairRequest.update({
        where: { id: input.repairRequestId },
        data: { relatedTradeId: input.tradeId },
      });

      await logUpdate(
        "RepairRequest",
        input.repairRequestId,
        ctx.userId,
        null,
        { relatedTradeId: input.tradeId },
        "关联了二手交易记录",
        input.repairRequestId
      );

      return updated;
    }),
});
