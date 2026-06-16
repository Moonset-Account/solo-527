import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";
import { createAuditLog } from "@/server/services/auditLogService";

export const qualityRouter = createTRPCRouter({
  listByWorkOrder: protectedProcedure
    .input(z.object({ workOrderId: z.string() }))
    .query(async ({ input }) => {
      const checks = await prisma.qualityCheck.findMany({
        where: { workOrderId: input.workOrderId },
        orderBy: { checkedAt: "desc" },
        include: { items: true },
      });
      return checks;
    }),

  create: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        result: z.enum(["PASSED", "FAILED", "PENDING"]),
        remarks: z.string().optional(),
        items: z.array(
          z.object({
            name: z.string(),
            result: z.enum(["PASS", "FAIL", "NA"]),
            remark: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const qualityCheck = await prisma.qualityCheck.create({
        data: {
          workOrderId: input.workOrderId,
          inspectorId: ctx.userId,
          result: input.result,
          remarks: input.remarks,
          items: {
            create: input.items,
          },
        },
        include: { items: true },
      });

      if (input.result === "PASSED") {
        await prisma.workOrder.update({
          where: { id: input.workOrderId },
          data: { status: "COMPLETED", actualDelivery: new Date() },
        });
      } else if (input.result === "FAILED") {
        await prisma.workOrder.update({
          where: { id: input.workOrderId },
          data: { status: "IN_PROGRESS" },
        });
      }

      await createAuditLog({
        action: "CREATE",
        entityType: "QUALITY_CHECK",
        entityId: qualityCheck.id,
        newValue: qualityCheck,
        userId: ctx.userId,
        userName: "当前用户",
      });

      return qualityCheck;
    }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        result: z.string().optional(),
        dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, result, dateRange } = input;
      const skip = (page - 1) * pageSize;

      const where: Record<string, unknown> = {};
      if (result) where.result = result;
      if (dateRange) {
        where.checkedAt = {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end),
        };
      }

      const [data, total] = await Promise.all([
        prisma.qualityCheck.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { checkedAt: "desc" },
          include: {
            workOrder: {
              include: { vehicle: { select: { plateNumber: true, brand: true, model: true } } },
            },
          },
        }),
        prisma.qualityCheck.count({ where }),
      ]);

      return { data, total, page, pageSize };
    }),
});
