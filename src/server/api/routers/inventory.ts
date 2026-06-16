import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";
import { createAuditLog } from "@/server/services/auditLogService";

export const inventoryRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        partId: z.string().optional(),
        type: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, partId, type } = input;
      const skip = (page - 1) * pageSize;

      const where: Record<string, unknown> = {};
      if (partId) where.partId = partId;
      if (type) where.type = type;

      const [data, total] = await Promise.all([
        prisma.inventoryRecord.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            part: { select: { code: true, name: true } },
          },
        }),
        prisma.inventoryRecord.count({ where }),
      ]);

      return { data, total, page, pageSize };
    }),

  inbound: protectedProcedure
    .input(
      z.object({
        partId: z.string(),
        quantity: z.number().positive(),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const part = await prisma.part.findUnique({
        where: { id: input.partId },
      });

      if (!part) {
        throw new Error("配件不存在");
      }

      const newBalance = part.stock + input.quantity;

      const record = await prisma.inventoryRecord.create({
        data: {
          partId: input.partId,
          type: "INBOUND",
          quantity: input.quantity,
          balanceAfter: newBalance,
          remark: input.remark,
          operatorId: ctx.userId,
        },
      });

      await prisma.part.update({
        where: { id: input.partId },
        data: { stock: newBalance },
      });

      await createAuditLog({
        action: "INBOUND",
        entityType: "INVENTORY",
        entityId: input.partId,
        newValue: { quantity: input.quantity, balance: newBalance },
        userId: ctx.userId,
        userName: "当前用户",
      });

      return record;
    }),

  outbound: protectedProcedure
    .input(
      z.object({
        partId: z.string(),
        quantity: z.number().positive(),
        workOrderId: z.string().optional(),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const part = await prisma.part.findUnique({
        where: { id: input.partId },
      });

      if (!part) {
        throw new Error("配件不存在");
      }

      if (part.stock < input.quantity) {
        throw new Error("库存不足");
      }

      const newBalance = part.stock - input.quantity;

      const record = await prisma.inventoryRecord.create({
        data: {
          partId: input.partId,
          type: "OUTBOUND",
          quantity: input.quantity,
          balanceAfter: newBalance,
          workOrderId: input.workOrderId,
          remark: input.remark,
          operatorId: ctx.userId,
        },
      });

      await prisma.part.update({
        where: { id: input.partId },
        data: { stock: newBalance },
      });

      await createAuditLog({
        action: "OUTBOUND",
        entityType: "INVENTORY",
        entityId: input.partId,
        newValue: { quantity: input.quantity, balance: newBalance },
        userId: ctx.userId,
        userName: "当前用户",
      });

      return record;
    }),

  transfer: protectedProcedure
    .input(
      z.object({
        partId: z.string(),
        fromLocation: z.string(),
        toLocation: z.string(),
        quantity: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const part = await prisma.part.findUnique({
        where: { id: input.partId },
      });

      if (!part) {
        throw new Error("配件不存在");
      }

      const record = await prisma.inventoryRecord.create({
        data: {
          partId: input.partId,
          type: "TRANSFER",
          quantity: input.quantity,
          balanceAfter: part.stock,
          remark: `从 ${input.fromLocation} 调拨到 ${input.toLocation}`,
          operatorId: ctx.userId,
        },
      });

      await prisma.part.update({
        where: { id: input.partId },
        data: { location: input.toLocation },
      });

      await createAuditLog({
        action: "TRANSFER",
        entityType: "INVENTORY",
        entityId: input.partId,
        newValue: { from: input.fromLocation, to: input.toLocation },
        userId: ctx.userId,
        userName: "当前用户",
      });

      return record;
    }),
});
