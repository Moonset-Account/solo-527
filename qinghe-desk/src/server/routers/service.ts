import { createTRPCRouter, publicProcedure } from "@/trpc/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const serviceRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      timeRange: z.object({ from: z.date(), to: z.date() }).optional(),
    }).optional())
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.status) where.status = input.status;
      if (input?.timeRange) {
        where.createdAt = { gte: input.timeRange.from, lte: input.timeRange.to };
      }
      return prisma.serviceRequest.findMany({
        where,
        include: { tenant: true, requester: true, assignee: true, statusLogs: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.serviceRequest.findUnique({
        where: { id: input.id },
        include: {
          tenant: true,
          requester: true,
          assignee: true,
          statusLogs: { orderBy: { createdAt: "asc" } },
        },
      });
    }),

  create: publicProcedure
    .input(z.object({
      tenantId: z.string(),
      requesterId: z.string(),
      type: z.string(),
      description: z.string(),
    }))
    .mutation(async ({ input }) => {
      const sr = await prisma.serviceRequest.create({ data: input });
      await prisma.serviceStatusLog.create({
        data: {
          serviceRequestId: sr.id,
          toStatus: "PENDING",
          operatorId: input.requesterId,
          note: "创建服务申请",
        },
      });
      return sr;
    }),

  approve: publicProcedure
    .input(z.object({ id: z.string(), assigneeId: z.string().optional(), operatorId: z.string() }))
    .mutation(async ({ input }) => {
      const updated = await prisma.serviceRequest.update({
        where: { id: input.id },
        data: { status: "APPROVED", assigneeId: input.assigneeId },
      });
      await prisma.serviceStatusLog.create({
        data: {
          serviceRequestId: input.id,
          fromStatus: "PENDING",
          toStatus: "APPROVED",
          operatorId: input.operatorId,
          note: input.assigneeId ? `分配给处理人` : "审批通过",
        },
      });
      return updated;
    }),

  reject: publicProcedure
    .input(z.object({ id: z.string(), reason: z.string(), operatorId: z.string() }))
    .mutation(async ({ input }) => {
      const updated = await prisma.serviceRequest.update({
        where: { id: input.id },
        data: { status: "REJECTED", rejectReason: input.reason },
      });
      await prisma.serviceStatusLog.create({
        data: {
          serviceRequestId: input.id,
          fromStatus: "PENDING",
          toStatus: "REJECTED",
          operatorId: input.operatorId,
          note: `驳回: ${input.reason}`,
        },
      });
      return updated;
    }),

  complete: publicProcedure
    .input(z.object({ id: z.string(), result: z.string(), operatorId: z.string() }))
    .mutation(async ({ input }) => {
      const updated = await prisma.serviceRequest.update({
        where: { id: input.id },
        data: { status: "COMPLETED" },
      });
      await prisma.serviceStatusLog.create({
        data: {
          serviceRequestId: input.id,
          fromStatus: "APPROVED",
          toStatus: "COMPLETED",
          operatorId: input.operatorId,
          note: input.result,
        },
      });
      return updated;
    }),
});
