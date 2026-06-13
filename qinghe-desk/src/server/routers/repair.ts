import { createTRPCRouter, publicProcedure } from "@/trpc/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentOperator } from "@/lib/auth";

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
      const repair = await prisma.repair.findUnique({
        where: { id: input.id },
        include: {
          tenant: true,
          room: { include: { building: true } },
          assignee: true,
          reporter: true,
        },
      });
      if (!repair) return null;
      const [attachments, notes] = await Promise.all([
        prisma.attachment.findMany({ where: { entityType: "Repair", entityId: repair.id } }),
        prisma.note.findMany({ where: { entityType: "Repair", entityId: repair.id }, include: { author: true }, orderBy: { createdAt: "desc" } }),
      ]);
      return { ...repair, attachments, notes };
    }),

  create: publicProcedure
    .input(z.object({
      tenantId: z.string(),
      roomId: z.string(),
      description: z.string(),
      urgency: z.enum(["HIGH", "MEDIUM", "LOW"]),
    }))
    .mutation(async ({ input }) => {
      const op = await getCurrentOperator();
      return prisma.repair.create({
        data: { ...input, reporterId: op.id },
      });
    }),

  resolve: publicProcedure
    .input(z.object({
      id: z.string(),
      result: z.string(),
    }))
    .mutation(async ({ input }) => {
      const op = await getCurrentOperator();
      return prisma.repair.update({
        where: { id: input.id },
        data: { status: "RESOLVED", result: input.result, resolvedAt: new Date(), assigneeId: op.id },
      });
    }),
});
