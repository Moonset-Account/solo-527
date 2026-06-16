import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";
import { createAuditLog } from "@/server/services/auditLogService";

export const partRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        keyword: z.string().optional(),
        category: z.string().optional(),
        stockStatus: z.enum(["ALL", "LOW", "NORMAL"]).default("ALL"),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, keyword, category, stockStatus } = input;
      const skip = (page - 1) * pageSize;

      const where: Record<string, unknown> = {};
      if (keyword) {
        where.OR = [
          { code: { contains: keyword, mode: "insensitive" } },
          { name: { contains: keyword, mode: "insensitive" } },
        ];
      }
      if (category) {
        where.category = category;
      }
      if (stockStatus === "LOW") {
        where.stock = { lte: { minStock: true } };
      }

      const [data, total] = await Promise.all([
        prisma.part.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.part.count({ where }),
      ]);

      return { data, total, page, pageSize };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const part = await prisma.part.findUnique({
        where: { id: input.id },
        include: {
          inventoryRecords: {
            take: 20,
            orderBy: { createdAt: "desc" },
          },
          priceHistories: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!part) {
        throw new Error("配件不存在");
      }

      return part;
    }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        name: z.string(),
        category: z.string(),
        unit: z.string(),
        price: z.number(),
        costPrice: z.number(),
        stock: z.number().default(0),
        minStock: z.number().default(0),
        location: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.part.findUnique({
        where: { code: input.code },
      });

      if (existing) {
        throw new Error("配件编码已存在");
      }

      const part = await prisma.part.create({
        data: input,
      });

      if (input.stock > 0) {
        await prisma.inventoryRecord.create({
          data: {
            partId: part.id,
            type: "INBOUND",
            quantity: input.stock,
            balanceAfter: input.stock,
            remark: "初始库存",
            operatorId: ctx.userId,
          },
        });
      }

      await createAuditLog({
        action: "CREATE",
        entityType: "PART",
        entityId: part.id,
        newValue: part,
        userId: ctx.userId,
        userName: "当前用户",
      });

      return part;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string().optional(),
        name: z.string().optional(),
        category: z.string().optional(),
        unit: z.string().optional(),
        price: z.number().optional(),
        costPrice: z.number().optional(),
        minStock: z.number().optional(),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const oldPart = await prisma.part.findUnique({
        where: { id: input.id },
      });

      if (!oldPart) {
        throw new Error("配件不存在");
      }

      const priceChanged =
        (input.price !== undefined && input.price !== oldPart.price.toNumber()) ||
        (input.costPrice !== undefined && input.costPrice !== oldPart.costPrice.toNumber());

      const part = await prisma.part.update({
        where: { id: input.id },
        data: input,
      });

      if (priceChanged) {
        await prisma.priceHistory.create({
          data: {
            partId: part.id,
            oldPrice: oldPart.price,
            newPrice: part.price,
            oldCostPrice: oldPart.costPrice,
            newCostPrice: part.costPrice,
            changedBy: ctx.userId,
          },
        });
      }

      await createAuditLog({
        action: "UPDATE",
        entityType: "PART",
        entityId: part.id,
        oldValue: oldPart,
        newValue: part,
        userId: ctx.userId,
        userName: "当前用户",
      });

      return part;
    }),

  updatePrice: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        price: z.number(),
        costPrice: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const oldPart = await prisma.part.findUnique({
        where: { id: input.id },
      });

      if (!oldPart) {
        throw new Error("配件不存在");
      }

      const part = await prisma.part.update({
        where: { id: input.id },
        data: {
          price: input.price,
          costPrice: input.costPrice,
        },
      });

      await prisma.priceHistory.create({
        data: {
          partId: part.id,
          oldPrice: oldPart.price,
          newPrice: part.price,
          oldCostPrice: oldPart.costPrice,
          newCostPrice: part.costPrice,
          changedBy: ctx.userId,
        },
      });

      await createAuditLog({
        action: "PRICE_UPDATE",
        entityType: "PART",
        entityId: part.id,
        oldValue: { price: oldPart.price, costPrice: oldPart.costPrice },
        newValue: { price: part.price, costPrice: part.costPrice },
        userId: ctx.userId,
        userName: "当前用户",
      });

      return part;
    }),
});
