import { z } from 'zod'
import { protectedProcedure, createTRPCRouter } from '../trpc'

export const supplyRouter = createTRPCRouter({
  listCategories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.supplyCategory.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    })
  }),

  createCategory: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      code: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.supplyCategory.create({ data: input })
    }),

  listItems: protectedProcedure
    .input(z.object({
      categoryId: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.supplyItem.findMany({
        where: {
          ...(input.categoryId && { categoryId: input.categoryId }),
          ...(input.search && {
            OR: [
              { name: { contains: input.search } },
              { specification: { contains: input.search } },
            ],
          }),
        },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    }),

  createItem: protectedProcedure
    .input(z.object({
      categoryId: z.string(),
      name: z.string().min(1),
      specification: z.string().min(1),
      unit: z.string().min(1),
      barcode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.supplyItem.create({ data: input })
    }),

  listMonthlyUsages: protectedProcedure
    .input(z.object({
      yearMonth: z.string().optional(),
      itemId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.monthlyUsage.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.yearMonth && { yearMonth: input.yearMonth }),
          ...(input.itemId && { itemId: input.itemId }),
        },
        include: { item: { include: { category: true } } },
        orderBy: { yearMonth: 'desc' },
        take: 200,
      })
    }),

  createMonthlyUsage: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
      quantity: z.coerce.number().positive(),
      actualCost: z.coerce.number().positive().optional(),
      remark: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.monthlyUsage.upsert({
        where: {
          userId_itemId_yearMonth: {
            userId: ctx.user.id,
            itemId: input.itemId,
            yearMonth: input.yearMonth,
          },
        },
        update: {
          quantity: input.quantity,
          actualCost: input.actualCost,
          remark: input.remark,
        },
        create: {
          userId: ctx.user.id,
          itemId: input.itemId,
          yearMonth: input.yearMonth,
          quantity: input.quantity,
          actualCost: input.actualCost,
          remark: input.remark,
        },
      })
    }),

  deleteMonthlyUsage: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.monthlyUsage.delete({ where: { id: input } })
    }),
})
