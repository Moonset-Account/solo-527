import { createTRPCRouter, publicProcedure } from "@/trpc/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const repairRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      urgency: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.status) where.status = input.status;
      if (input?.urgency) where.urgency = input.urgency;
      return prisma.repair.findMany({
        where,
        include: { tenant: true, room: { include: { building: true } }, assignee: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.repair.findUnique({
        where: { id: input.id },
        include: {
          tenant: true,
          room: { include: { building: true } },
          assignee: true,
        },
      });
    }),

  create: publicProcedure
    .input(z.object({
      tenantId: z.string(),
      roomId: z.string(),
      reporterId: z.string(),
      description: z.string(),
      urgency: z.enum(["HIGH", "MEDIUM", "LOW"]),
    }))
    .mutation(async ({ input }) => {
      return prisma.repair.create({ data: input });
    }),

  resolve: publicProcedure
    .input(z.object({
      id: z.string(),
      result: z.string(),
      assigneeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return prisma.repair.update({
        where: { id: input.id },
        data: { status: "RESOLVED", result: input.result, resolvedAt: new Date(), assigneeId: input.assigneeId },
      });
    }),
});
