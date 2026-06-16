import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";
import { createAuditLog } from "@/server/services/auditLogService";

function generateOrderNo() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `WO${dateStr}${random}`;
}

export const workOrderRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.string().optional(),
        keyword: z.string().optional(),
        priority: z.string().optional(),
        dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, status, keyword, priority, dateRange } = input;
      const skip = (page - 1) * pageSize;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (keyword) {
        where.OR = [
          { orderNo: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { vehicle: { plateNumber: { contains: keyword, mode: "insensitive" } } },
        ];
      }
      if (dateRange) {
        where.createdAt = {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end),
        };
      }

      const [data, total] = await Promise.all([
        prisma.workOrder.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            vehicle: { select: { plateNumber: true, brand: true, model: true } },
            _count: { select: { items: true } },
          },
        }),
        prisma.workOrder.count({ where }),
      ]);

      return { data, total, page, pageSize };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: input.id },
        include: {
          vehicle: true,
          items: true,
          schedules: {
            include: { team: true },
            orderBy: { scheduledDate: "asc" },
          },
          qualityChecks: {
            include: { items: true },
            orderBy: { checkedAt: "desc" },
          },
          delayRecords: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!workOrder) {
        throw new Error("工单不存在");
      }

      return workOrder;
    }),

  create: protectedProcedure
    .input(
      z.object({
        vehicleId: z.string(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
        description: z.string(),
        estimatedDelivery: z.string(),
        items: z
          .array(
            z.object({
              type: z.enum(["SERVICE", "PART"]),
              name: z.string(),
              quantity: z.number(),
              unitPrice: z.number(),
              partId: z.string().optional(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const orderNo = generateOrderNo();

      const totalPartCost = input.items
        .filter((item) => item.type === "PART")
        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      const totalLaborCost = input.items
        .filter((item) => item.type === "SERVICE")
        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      const totalCost = totalPartCost + totalLaborCost;

      const workOrder = await prisma.workOrder.create({
        data: {
          orderNo,
          vehicleId: input.vehicleId,
          priority: input.priority,
          description: input.description,
          estimatedDelivery: new Date(input.estimatedDelivery),
          totalCost,
          totalLaborCost,
          totalPartCost,
          items: {
            create: input.items.map((item) => ({
              ...item,
              subtotal: item.quantity * item.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of input.items) {
        if (item.type === "PART" && item.partId && item.quantity > 0) {
          const part = await prisma.part.findUnique({ where: { id: item.partId } });
          if (part && part.stock >= item.quantity) {
            await prisma.part.update({
              where: { id: item.partId },
              data: { stock: { decrement: item.quantity } },
            });
            await prisma.inventoryRecord.create({
              data: {
                partId: item.partId,
                type: "OUTBOUND",
                quantity: item.quantity,
                balanceAfter: part.stock - item.quantity,
                workOrderId: workOrder.id,
                remark: `工单 ${orderNo} 领用`,
                operatorId: ctx.userId,
              },
            });
          }
        }
      }

      await createAuditLog({
        action: "CREATE",
        entityType: "WORK_ORDER",
        entityId: workOrder.id,
        newValue: workOrder,
        userId: ctx.userId,
        userName: "当前用户",
      });

      return workOrder;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "PENDING",
          "ASSIGNED",
          "IN_PROGRESS",
          "QUALITY_CHECK",
          "COMPLETED",
          "DELAYED",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const oldOrder = await prisma.workOrder.findUnique({
        where: { id: input.id },
      });

      if (!oldOrder) {
        throw new Error("工单不存在");
      }

      const data: Record<string, unknown> = { status: input.status };
      if (input.status === "COMPLETED") {
        data.actualDelivery = new Date();
      }

      const workOrder = await prisma.workOrder.update({
        where: { id: input.id },
        data,
      });

      await createAuditLog({
        action: "STATUS_CHANGE",
        entityType: "WORK_ORDER",
        entityId: input.id,
        oldValue: { status: oldOrder.status },
        newValue: { status: input.status },
        userId: ctx.userId,
        userName: "当前用户",
      });

      return workOrder;
    }),

  addItem: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        type: z.enum(["SERVICE", "PART"]),
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        partId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const subtotal = input.quantity * input.unitPrice;

      const item = await prisma.workOrderItem.create({
        data: {
          ...input,
          subtotal,
        },
      });

      const workOrder = await prisma.workOrder.findUnique({
        where: { id: input.workOrderId },
        include: { items: true },
      });

      if (workOrder) {
        const totalPartCost = workOrder.items
          .filter((i) => i.type === "PART")
          .reduce((sum, i) => sum + i.subtotal.toNumber(), 0);
        const totalLaborCost = workOrder.items
          .filter((i) => i.type === "SERVICE")
          .reduce((sum, i) => sum + i.subtotal.toNumber(), 0);

        await prisma.workOrder.update({
          where: { id: input.workOrderId },
          data: {
            totalPartCost,
            totalLaborCost,
            totalCost: totalPartCost + totalLaborCost,
          },
        });
      }

      if (input.type === "PART" && input.partId && input.quantity > 0) {
        const part = await prisma.part.findUnique({ where: { id: input.partId } });
        if (part && part.stock >= input.quantity) {
          await prisma.part.update({
            where: { id: input.partId },
            data: { stock: { decrement: input.quantity } },
          });
          await prisma.inventoryRecord.create({
            data: {
              partId: input.partId,
              type: "OUTBOUND",
              quantity: input.quantity,
              balanceAfter: part.stock - input.quantity,
              workOrderId: input.workOrderId,
              remark: `工单追加领用`,
              operatorId: ctx.userId,
            },
          });
        }
      }

      return item;
    }),

  removeItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const item = await prisma.workOrderItem.findUnique({
        where: { id: input.itemId },
      });

      if (!item) {
        throw new Error("项目不存在");
      }

      await prisma.workOrderItem.delete({
        where: { id: input.itemId },
      });

      const workOrder = await prisma.workOrder.findUnique({
        where: { id: item.workOrderId },
        include: { items: true },
      });

      if (workOrder) {
        const totalPartCost = workOrder.items
          .filter((i) => i.type === "PART")
          .reduce((sum, i) => sum + i.subtotal.toNumber(), 0);
        const totalLaborCost = workOrder.items
          .filter((i) => i.type === "SERVICE")
          .reduce((sum, i) => sum + i.subtotal.toNumber(), 0);

        await prisma.workOrder.update({
          where: { id: item.workOrderId },
          data: {
            totalPartCost,
            totalLaborCost,
            totalCost: totalPartCost + totalLaborCost,
          },
        });
      }

      if (item.type === "PART" && item.partId) {
        await prisma.part.update({
          where: { id: item.partId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return true;
    }),
});
