import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

export const auditLogRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        fieldName: z.string().optional(),
        take: z.number().optional().default(20),
        skip: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const { take, skip, ...filters } = input;
      const where: Record<string, unknown> = {};
      if (filters.entityType) where.entityType = filters.entityType;
      if (filters.entityId) where.entityId = filters.entityId;
      if (filters.fieldName) where.fieldName = filters.fieldName;

      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.count({ where }),
      ]);
      return { items, total };
    }),

  getByEntity: publicProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return prisma.auditLog.findMany({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
        },
        orderBy: { createdAt: "desc" },
      });
    }),
});
