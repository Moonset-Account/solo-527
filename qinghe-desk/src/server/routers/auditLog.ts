import { createTRPCRouter, publicProcedure } from "@/trpc/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const auditLogRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      entityType: z.string().optional(),
      field: z.string().optional(),
      operatorId: z.string().optional(),
      timeRange: z.object({ from: z.date(), to: z.date() }).optional(),
    }).optional())
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.entityType) where.entityType = input.entityType;
      if (input?.field) where.field = input.field;
      if (input?.operatorId) where.operatorId = input.operatorId;
      if (input?.timeRange) {
        where.operatedAt = { gte: input.timeRange.from, lte: input.timeRange.to };
      }
      return prisma.auditLog.findMany({
        where,
        include: { operator: true },
        orderBy: { operatedAt: "desc" },
        take: 100,
      });
    }),
});
