import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";

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

      setTimeout(async () => {
        try {
          await prisma.exportTask.update({
            where: { id: task.id },
            data: { status: "PROCESSING" },
          });

          let totalRecords = 0;
          switch (input.type) {
            case "VEHICLES":
              totalRecords = await prisma.vehicle.count();
              break;
            case "WORK_ORDERS":
              totalRecords = await prisma.workOrder.count();
              break;
            case "PARTS":
              totalRecords = await prisma.part.count();
              break;
            default:
              totalRecords = 100;
          }

          await prisma.exportTask.update({
            where: { id: task.id },
            data: {
              totalRecords,
              processedRecords: totalRecords,
              status: "COMPLETED",
              downloadUrl: `/api/exports/${task.id}`,
              completedAt: new Date(),
            },
          });
        } catch (error) {
          await prisma.exportTask.update({
            where: { id: task.id },
            data: { status: "FAILED" },
          });
        }
      }, 1000);

      return task;
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
