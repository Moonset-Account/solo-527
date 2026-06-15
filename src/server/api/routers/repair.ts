import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { RepairCategory, RepairStatus, LogAction, Prisma } from "@prisma/client";
import { createAuditLog, logRepairStatusChange, logCreate, logUpdate } from "@/lib/audit-log";
import { notifyRepairStatusChange } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const repairRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "标题不能为空").max(200),
        description: z.string().min(1, "描述不能为空"),
        category: z.nativeEnum(RepairCategory),
        dormNumber: z.string().min(1),
        roomNumber: z.string().min(1),
        priority: z.number().min(1).max(5).default(1),
        photoIds: z.array(z.string()).optional(),
        relatedTradeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const repair = await ctx.prisma.repairRequest.create({
        data: {
          title: input.title,
          description: input.description,
          category: input.category,
          dormNumber: input.dormNumber,
          roomNumber: input.roomNumber,
          priority: input.priority,
          reportedById: ctx.userId,
          relatedTradeId: input.relatedTradeId,
        },
      });

      if (input.photoIds && input.photoIds.length > 0) {
        await ctx.prisma.repairPhoto.updateMany({
          where: { id: { in: input.photoIds } },
          data: { repairRequestId: repair.id },
        });
      }

      await logCreate(
        "RepairRequest",
        repair.id,
        ctx.userId,
        input,
        `${ctx.user.name} 创建了报修单: ${input.title}`,
        repair.id
      );

      await ctx.prisma.activityParticipation.create({
        data: {
          userId: ctx.userId,
          activityName: "提交报修",
          activityType: "REPAIR_SUBMIT",
          repairRequestId: repair.id,
          points: 5,
        },
      });

      return repair;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().min(1).optional(),
        category: z.nativeEnum(RepairCategory).optional(),
        priority: z.number().min(1).max(5).optional(),
        estimatedCost: z.number().optional(),
        actualCost: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      const existing = await ctx.prisma.repairRequest.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("报修单不存在");
      }

      if (existing.reportedById !== ctx.userId && ctx.user.role === "STUDENT") {
        throw new Error("无权限修改此报修单");
      }

      const updated = await ctx.prisma.repairRequest.update({
        where: { id },
        data,
      });

      await logUpdate(
        "RepairRequest",
        id,
        ctx.userId,
        existing,
        data,
        `${ctx.user.name} 更新了报修单`,
        id
      );

      return updated;
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(RepairStatus),
        note: z.string().optional(),
        assignedToId: z.string().optional(),
        scheduledAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.repairRequest.findUnique({
        where: { id: input.id },
        include: { reportedBy: true },
      });

      if (!existing) {
        throw new Error("报修单不存在");
      }

      const oldStatus = existing.status;

      const updated = await ctx.prisma.repairRequest.update({
        where: { id: input.id },
        data: {
          status: input.status,
          assignedToId: input.assignedToId,
          scheduledAt: input.scheduledAt,
          completedAt: input.status === "COMPLETED" ? new Date() : existing.completedAt,
        },
      });

      await logRepairStatusChange(
        input.id,
        ctx.userId,
        oldStatus,
        input.status,
        ctx.user
      );

      if (input.note) {
        await ctx.prisma.comment.create({
          data: {
            content: input.note,
            repairRequestId: input.id,
            authorId: ctx.userId,
            isInternal: true,
          },
        });
      }

      await notifyRepairStatusChange(
        input.id,
        existing.reportedById,
        oldStatus,
        input.status
      );

      if (input.status === "COMPLETED") {
        await ctx.prisma.activityParticipation.create({
          data: {
            userId: existing.reportedById,
            activityName: "报修完成",
            activityType: "REPAIR_COMPLETE",
            repairRequestId: input.id,
            points: 10,
          },
        });
      }

      return updated;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repair = await ctx.prisma.repairRequest.findUnique({
        where: { id: input.id },
        include: {
          reportedBy: { select: { id: true, name: true, email: true, studentId: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          photos: true,
          comments: {
            include: {
              author: { select: { id: true, name: true, role: true } },
              attachments: true,
            },
            orderBy: { createdAt: "desc" },
          },
          complaints: {
            include: {
              submittedBy: { select: { id: true, name: true } },
            },
          },
          refunds: {
            include: {
              requestedBy: { select: { id: true, name: true } },
              processedBy: { select: { id: true, name: true } },
            },
          },
          relatedTrade: {
            include: {
              seller: { select: { id: true, name: true } },
              buyer: { select: { id: true, name: true } },
            },
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
          _count: {
            select: {
              comments: true,
              photos: true,
            },
          },
        },
      });

      if (!repair) {
        return null;
      }

      if (
        repair.reportedById !== ctx.userId &&
        ctx.user.role === "STUDENT"
      ) {
        return {
          ...repair,
          comments: repair.comments.filter((c) => !c.isInternal),
        };
      }

      return repair;
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        status: z.nativeEnum(RepairStatus).optional(),
        category: z.nativeEnum(RepairCategory).optional(),
        dormNumber: z.string().optional(),
        roomNumber: z.string().optional(),
        search: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        mineOnly: z.boolean().default(false),
        assignedOnly: z.boolean().default(false),
        sortBy: z.enum(["createdAt", "updatedAt", "priority", "status"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.status) where.status = input.status;
      if (input.category) where.category = input.category;
      if (input.dormNumber) where.dormNumber = input.dormNumber;
      if (input.roomNumber) where.roomNumber = input.roomNumber;
      if (input.dateFrom) where.createdAt = { ...where.createdAt, gte: input.dateFrom };
      if (input.dateTo) where.createdAt = { ...where.createdAt, lte: input.dateTo };
      if (input.mineOnly && ctx.user.role === "STUDENT") {
        where.reportedById = ctx.userId;
      }
      if (input.assignedOnly && ctx.user.role !== "STUDENT") {
        where.assignedToId = ctx.userId;
      }
      if (input.search) {
        where.OR = [
          { title: { contains: input.search } },
          { description: { contains: input.search } },
          { reportedBy: { name: { contains: input.search } } },
          { reportedBy: { studentId: { contains: input.search } } },
        ];
      }

      const skip = (input.page - 1) * input.pageSize;
      const take = input.pageSize;

      const [items, total] = await Promise.all([
        ctx.prisma.repairRequest.findMany({
          where,
          include: {
            reportedBy: { select: { id: true, name: true, studentId: true } },
            assignedTo: { select: { id: true, name: true } },
            _count: { select: { photos: true, comments: true } },
          },
          skip,
          take,
          orderBy: { [input.sortBy]: input.sortOrder },
        }),
        ctx.prisma.repairRequest.count({ where }),
      ]);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  uploadPhoto: protectedProcedure
    .input(
      z.object({
        repairRequestId: z.string().optional(),
        url: z.string(),
        key: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { repairRequestId, ...photoData } = input;

      const photo = await ctx.prisma.repairPhoto.create({
        data: {
          ...photoData,
          repairRequestId: repairRequestId || "",
          uploadedById: ctx.userId,
        },
      });

      await createAuditLog({
        action: LogAction.UPLOAD,
        entityType: "RepairPhoto",
        entityId: photo.id,
        userId: ctx.userId,
        description: `${ctx.user.name} 上传了照片: ${input.fileName}`,
        repairRequestId,
      });

      return photo;
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        repairRequestId: z.string(),
        content: z.string().min(1),
        isInternal: z.boolean().default(false),
        attachmentIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const repair = await ctx.prisma.repairRequest.findUnique({
        where: { id: input.repairRequestId },
      });

      if (!repair) {
        throw new Error("报修单不存在");
      }

      if (
        repair.reportedById !== ctx.userId &&
        ctx.user.role === "STUDENT" &&
        input.isInternal
      ) {
        throw new Error("无权限添加内部备注");
      }

      const comment = await ctx.prisma.comment.create({
        data: {
          content: input.content,
          repairRequestId: input.repairRequestId,
          authorId: ctx.userId,
          isInternal: input.isInternal,
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
        { content: input.content, isInternal: input.isInternal },
        `${ctx.user.name} 添加了${input.isInternal ? "内部" : ""}备注`,
        input.repairRequestId
      );

      return comment;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.repairRequest.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new Error("报修单不存在");
      }

      await ctx.prisma.repairRequest.delete({
        where: { id: input.id },
      });

      await createAuditLog({
        action: LogAction.DELETE,
        entityType: "RepairRequest",
        entityId: input.id,
        userId: ctx.userId,
        oldValue: existing as any,
        description: `${ctx.user.name} 删除了报修单: ${existing.title}`,
        repairRequestId: input.id,
      });

      return { success: true };
    }),

  getStatistics: adminProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.dateFrom) where.createdAt = { ...where.createdAt, gte: input.dateFrom };
      if (input.dateTo) where.createdAt = { ...where.createdAt, lte: input.dateTo };

      const [total, statusStats, categoryStats, monthlyStats] = await Promise.all([
        ctx.prisma.repairRequest.count({ where }),
        ctx.prisma.repairRequest.groupBy({
          by: ["status"],
          where,
          _count: true,
        }),
        ctx.prisma.repairRequest.groupBy({
          by: ["category"],
          where,
          _count: true,
          _avg: { priority: true },
        }),
        ctx.prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', "createdAt") as month,
            COUNT(*) as count,
            COUNT(*) FILTER (WHERE "status" = 'COMPLETED') as completed
          FROM "RepairRequest"
          ${input.dateFrom || input.dateTo ? Prisma.sql`WHERE 1=1 ${input.dateFrom ? Prisma.sql`AND "createdAt" >= ${input.dateFrom}` : Prisma.empty} ${input.dateTo ? Prisma.sql`AND "createdAt" <= ${input.dateTo}` : Prisma.empty}` : Prisma.empty}
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month DESC
          LIMIT 12
        `,
      ]);

      return {
        total,
        statusStats,
        categoryStats,
        monthlyStats,
      };
    }),
});
