import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, superAdminProcedure } from "../trpc";
import { LogAction } from "@prisma/client";

export const auditLogRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        action: z.nativeEnum(LogAction).optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        userId: z.string().optional(),
        repairRequestId: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.action) where.action = input.action;
      if (input.entityType) where.entityType = input.entityType;
      if (input.entityId) where.entityId = input.entityId;
      if (input.userId) where.userId = input.userId;
      if (input.repairRequestId) where.repairRequestId = input.repairRequestId;
      if (input.dateFrom) where.createdAt = { ...where.createdAt, gte: input.dateFrom };
      if (input.dateTo) where.createdAt = { ...where.createdAt, lte: input.dateTo };

      const skip = (input.page - 1) * input.pageSize;
      const take = input.pageSize;

      const [items, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, role: true, email: true } },
          },
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.auditLog.count({ where }),
      ]);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  getByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.auditLog.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
        take: input.limit,
        orderBy: { createdAt: "desc" },
      });
    }),

  getMyLogs: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        action: z.nativeEnum(LogAction).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { userId: ctx.userId };
      if (input.action) where.action = input.action;

      const skip = (input.page - 1) * input.pageSize;
      const take = input.pageSize;

      const [items, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.auditLog.count({ where }),
      ]);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  getStatistics: superAdminProcedure
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

      const [total, actionStats, entityStats, userStats] = await Promise.all([
        ctx.prisma.auditLog.count({ where }),
        ctx.prisma.auditLog.groupBy({
          by: ["action"],
          where,
          _count: true,
        }),
        ctx.prisma.auditLog.groupBy({
          by: ["entityType"],
          where,
          _count: true,
        }),
        ctx.prisma.auditLog.groupBy({
          by: ["userId"],
          where,
          _count: true,
          orderBy: { _count: { createdAt: "desc" } },
          take: 10,
        }),
      ]);

      return {
        total,
        actionStats,
        entityStats,
        topUsers: userStats,
      };
    }),
});
