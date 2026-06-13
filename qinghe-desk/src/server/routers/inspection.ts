import { createTRPCRouter, publicProcedure } from "@/trpc/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentOperator } from "@/lib/auth";

export const inspectionRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      date: z.string().optional(),
      area: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.area) where.area = { contains: input.area };
      if (input?.date) where.inspectedAt = { gte: new Date(input.date), lt: new Date(new Date(input.date).getTime() + 86400000) };
      return prisma.inspection.findMany({
        where,
        include: { inspector: true, items: true, anomalies: { include: { handler: true } } },
        orderBy: { inspectedAt: "desc" },
      });
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.inspection.findUnique({
        where: { id: input.id },
        include: { inspector: true, items: true, anomalies: { include: { handler: true } } },
      });
    }),

  create: publicProcedure
    .input(z.object({
      area: z.string(),
      checklist: z.array(z.object({ item: z.string(), passed: z.boolean(), note: z.string().optional() })),
    }))
    .mutation(async ({ input }) => {
      const op = await getCurrentOperator();
      const inspection = await prisma.inspection.create({
        data: {
          area: input.area,
          inspectorId: op.id,
          items: { create: input.checklist },
        },
        include: { items: true },
      });
      const hasFailed = input.checklist.some((c) => !c.passed);
      if (hasFailed) {
        await prisma.inspection.update({
          where: { id: inspection.id },
          data: { status: "HAS_ANOMALY" },
        });
      }
      return inspection;
    }),

  reportAnomaly: publicProcedure
    .input(z.object({
      inspectionId: z.string(),
      affectedObjects: z.string(),
      handlerId: z.string(),
      followUpAction: z.string(),
    }))
    .mutation(async ({ input }) => {
      return prisma.anomaly.create({ data: input });
    }),

  resolveAnomaly: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.anomaly.update({
        where: { id: input.id },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });
    }),
});
