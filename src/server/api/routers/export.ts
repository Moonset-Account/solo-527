import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";
import { createAuditLog } from "@/server/services/auditLogService";

async function processExport(taskId: string, type: string, userId: string) {
  try {
    await prisma.exportTask.update({
      where: { id: taskId },
      data: { status: "PROCESSING", processedRecords: 0 },
    });

    let totalRecords = 0;

    switch (type) {
      case "VEHICLES":
        totalRecords = await prisma.vehicle.count();
        break;
      case "WORK_ORDERS":
        totalRecords = await prisma.workOrder.count();
        break;
      case "PARTS":
        totalRecords = await prisma.part.count();
        break;
      case "INVENTORY":
        totalRecords = await prisma.inventoryRecord.count();
        break;
      case "SCHEDULES":
        totalRecords = await prisma.schedule.count();
        break;
      case "QUALITY_CHECKS":
        totalRecords = await prisma.qualityCheck.count();
        break;
      default:
        totalRecords = 0;
    }

    await prisma.exportTask.update({
      where: { id: taskId },
      data: {
        totalRecords,
        processedRecords: totalRecords,
        status: "COMPLETED",
        downloadUrl: `/api/exports/${taskId}`,
        completedAt: new Date(),
      },
    });

    await createAuditLog({
      action: "EXPORT",
      entityType: "EXPORT_TASK",
      entityId: taskId,
      newValue: { type, totalRecords },
      userId,
      userName: "当前用户",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "导出失败";
    await prisma.exportTask.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        errorMessage,
      },
    });
  }
}

export const exportRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status } = input;
      const skip = (page - 1) * pageSize;

      const where: Record<string, unknown> = { createdBy: ctx.userId };
      if (status) where.status = status;

      const [data, total] = await Promise.all([
        prisma.exportTask.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.exportTask.count({ where }),
      ]);

      return { data, total, page, pageSize };
    }),

  create: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        filters: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.exportTask.create({
        data: {
          type: input.type,
          status: "PENDING",
          filters: input.filters,
          createdBy: ctx.userId,
        },
      });

      setTimeout(() => {
        void processExport(task.id, input.type, ctx.userId);
      }, 500);

      return task;
    }),

  retry: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.exportTask.findUnique({
        where: { id: input.id },
      });

      if (!task || task.createdBy !== ctx.userId) {
        throw new Error("导出任务不存在");
      }

      if (task.status !== "FAILED" && task.status !== "PENDING") {
        throw new Error("当前状态不支持重试");
      }

      await prisma.exportTask.update({
        where: { id: input.id },
        data: {
          status: "PENDING",
          errorMessage: null,
          processedRecords: 0,
          totalRecords: 0,
          downloadUrl: null,
          completedAt: null,
        },
      });

      setTimeout(() => {
        void processExport(task.id, task.type, ctx.userId);
      }, 500);

      return { success: true };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await prisma.exportTask.findUnique({
        where: { id: input.id },
      });

      if (!task || task.createdBy !== ctx.userId) {
        throw new Error("导出任务不存在");
      }

      return task;
    }),
});
