import { createTRPCRouter, publicProcedure } from "@/trpc/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const billRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      tenantId: z.string().optional(),
      status: z.string().optional(),
      month: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.tenantId) where.tenantId = input.tenantId;
      if (input?.status) where.status = input.status;
      if (input?.month) where.period = { contains: input.month };
      return prisma.bill.findMany({
        where,
        include: { tenant: true, room: { include: { building: true } }, items: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.bill.findUnique({
        where: { id: input.id },
        include: {
          tenant: true,
          room: { include: { building: true } },
          items: true,
        },
      });
    }),

  create: publicProcedure
    .input(z.object({
      tenantId: z.string(),
      roomId: z.string(),
      period: z.string(),
      dueDate: z.string(),
      creatorId: z.string(),
      items: z.array(z.object({ name: z.string(), amount: z.number(), category: z.string() })),
    }))
    .mutation(async ({ input }) => {
      const totalAmount = input.items.reduce((sum, i) => sum + i.amount, 0);
      const bill = await prisma.bill.create({
        data: {
          tenantId: input.tenantId,
          roomId: input.roomId,
          period: input.period,
          totalAmount,
          dueDate: new Date(input.dueDate),
          creatorId: input.creatorId,
          items: { create: input.items },
        },
        include: { items: true },
      });
      return bill;
    }),

  markPaid: publicProcedure
    .input(z.object({ id: z.string(), operatorId: z.string() }))
    .mutation(async ({ input }) => {
      const updated = await prisma.bill.update({
        where: { id: input.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      await prisma.auditLog.create({
        data: {
          entityType: "Bill",
          entityId: input.id,
          field: "status",
          oldValue: "PENDING",
          newValue: "PAID",
          operatorId: input.operatorId,
        },
      });
      return updated;
    }),
});
