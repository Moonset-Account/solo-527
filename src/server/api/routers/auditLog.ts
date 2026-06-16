import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";

export const auditLogRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        entityType: z.string().optional(),
        action: z.string().optional(),
        userId: z.string().optional(),
        dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, entityType, action, userId, dateRange } = input;
      const skip = (page - 1) * pageSize;

      const where: Record<string, unknown> = {};
      if (entityType) where.entityType = entityType;
      if (action) where.action = action;
      if (userId) where.userId = userId;
      if (dateRange) {
        where.createdAt = {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end),
        };
      }

      const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return { data, total, page, pageSize };
    }),

  getByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, entityType, entityId } = input;
      const skip = (page - 1) * pageSize;

      const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { entityType, entityId },
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.count({ where: { entityType, entityId } }),
      ]);

      return { data, total, page, pageSize };
    }),
});
