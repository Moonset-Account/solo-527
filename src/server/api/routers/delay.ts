import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";
import { createAuditLog } from "@/server/services/auditLogService";

export const delayRouter = createTRPCRouter({
  listByWorkOrder: protectedProcedure
    .input(z.object({ workOrderId: z.string() }))
    .query(async ({ input }) => {
      const records = await prisma.delayRecord.findMany({
        where: { workOrderId: input.workOrderId },
        orderBy: { createdAt: "desc" },
      });
      return records;
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize } = input;
      const skip = (page - 1) * pageSize;

      const [data, total] = await Promise.all([
        prisma.delayRecord.findMany({
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            workOrder: {
              include: { vehicle: { select: { plateNumber: true, brand: true, model: true } } },
            },
          },
        }),
        prisma.delayRecord.count(),
      ]);

      return { data, total, page, pageSize };
    }),

  create: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        reason: z.string(),
        impactScope: z.string(),
        actionTaken: z.string(),
        nextStep: z.string(),
        newEstimatedDelivery: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const delayRecord = await prisma.delayRecord.create({
        data: {
          workOrderId: input.workOrderId,
          reason: input.reason,
          impactScope: input.impactScope,
          actionTaken: input.actionTaken,
          nextStep: input.nextStep,
          newEstimatedDelivery: new Date(input.newEstimatedDelivery),
          createdBy: ctx.userId,
        },
      });

      await prisma.workOrder.update({
        where: { id: input.workOrderId },
        data: {
          status: "DELAYED",
          estimatedDelivery: new Date(input.newEstimatedDelivery),
        },
      });

      await createAuditLog({
        action: "CREATE",
        entityType: "DELAY_RECORD",
        entityId: delayRecord.id,
        newValue: delayRecord,
        userId: ctx.userId,
        userName: "当前用户",
      });

      return delayRecord;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const record = await prisma.delayRecord.findUnique({
        where: { id: input.id },
        include: {
          workOrder: {
            include: {
              vehicle: true,
              items: true,
              delayRecords: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      });

      if (!record) {
        throw new Error("延期记录不存在");
      }

      return record;
    }),
});
