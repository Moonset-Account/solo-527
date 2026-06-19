import { z } from 'zod'
import { protectedProcedure, createTRPCRouter, requireRole } from '../trpc'
import type { Prisma } from '@prisma/client'

export const procurementRouter = createTRPCRouter({
  listSuppliers: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.supplier.findMany({
        where: {
          ...(input.search && {
            OR: [
              { name: { contains: input.search } },
              { code: { contains: input.search } },
            ],
          }),
          ...(input.status !== undefined && { status: input.status }),
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
    }),

  createSupplier: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      code: z.string().min(1),
      contactPerson: z.string(),
      contactEmail: z.string().email(),
      contactPhone: z.string(),
      address: z.string().optional(),
      taxNumber: z.string().optional(),
      bankAccount: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.supplier.create({ data: input })
    }),

  listAgreements: protectedProcedure
    .input(z.object({ supplierId: z.string().optional(), status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.frameworkAgreement.findMany({
        where: {
          ...(input.supplierId && { supplierId: input.supplierId }),
          ...(input.status && { status: input.status as any }),
        },
        include: {
          supplier: true,
          items: { include: { item: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    }),

  createAgreement: protectedProcedure
    .input(z.object({
      supplierId: z.string(),
      agreementNumber: z.string(),
      title: z.string(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      totalAmount: z.coerce.number(),
      paymentTerms: z.string(),
      termsConditions: z.string().optional(),
      items: z.array(z.object({
        itemId: z.string(),
        unitPrice: z.coerce.number().positive(),
        minOrderQuantity: z.coerce.number().int().positive(),
        maxOrderQuantity: z.coerce.number().int().positive().optional(),
        leadTimeDays: z.coerce.number().int().positive(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { items, ...data } = input
      return ctx.prisma.frameworkAgreement.create({
        data: {
          ...data,
          items: { create: items },
        },
      })
    }),

  listRequirements: protectedProcedure
    .input(z.object({ status: z.string().optional(), userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.purchaseRequirement.findMany({
        where: {
          ...(input.status && { status: input.status as any }),
          ...(input.userId && { userId: input.userId }),
          ...(ctx.role === 'EMPLOYEE' && { userId: ctx.user.id }),
        },
        include: {
          user: { select: { name: true, department: true } },
          items: { include: { item: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    }),

  createRequirement: protectedProcedure
    .input(z.object({
      title: z.string(),
      department: z.string(),
      requiredDate: z.coerce.date(),
      priority: z.coerce.number().int().min(1).max(5),
      remark: z.string().optional(),
      items: z.array(z.object({
        itemId: z.string(),
        quantity: z.coerce.number().positive(),
        expectedPrice: z.coerce.number().positive().optional(),
        remark: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { items, ...data } = input
      const requirement = await ctx.prisma.purchaseRequirement.create({
        data: {
          ...data,
          userId: ctx.user.id,
          items: { create: items },
        },
      })

      await checkAndTriggerAlerts(ctx.prisma, 'PURCHASE_REQUIREMENT', requirement.id, requirement)
      return requirement
    }),

  listQuotes: protectedProcedure
    .input(z.object({ supplierId: z.string().optional(), requirementId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.supplierQuote.findMany({
        where: {
          ...(input.supplierId && { supplierId: input.supplierId }),
          ...(input.requirementId && { requirementId: input.requirementId }),
        },
        include: {
          supplier: true,
          requirement: { select: { title: true } },
          items: { include: { item: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    }),

  createQuote: protectedProcedure
    .input(z.object({
      supplierId: z.string(),
      requirementId: z.string().optional(),
      quoteNumber: z.string(),
      validUntil: z.coerce.date(),
      totalAmount: z.coerce.number(),
      deliveryDate: z.coerce.date().optional(),
      paymentTerms: z.string().optional(),
      remark: z.string().optional(),
      items: z.array(z.object({
        itemId: z.string(),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().positive(),
        remark: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { items, ...data } = input
      const quote = await ctx.prisma.supplierQuote.create({
        data: {
          ...data,
          items: { create: items },
        },
      })

      await checkAndTriggerAlerts(ctx.prisma, 'SUPPLIER_QUOTE', quote.id, quote)
      return quote
    }),

  listDeliveries: protectedProcedure
    .input(z.object({ supplierId: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.deliveryRecord.findMany({
        where: {
          ...(input.supplierId && { supplierId: input.supplierId }),
          ...(input.startDate && { deliveryDate: { gte: new Date(input.startDate) } }),
          ...(input.endDate && { deliveryDate: { lte: new Date(input.endDate) } }),
        },
        include: {
          supplier: true,
          items: { include: { item: true } },
          reconciliations: true,
        },
        orderBy: { deliveryDate: 'desc' },
        take: 200,
      })
    }),

  createDelivery: protectedProcedure
    .input(z.object({
      supplierId: z.string(),
      deliveryNumber: z.string(),
      deliveryDate: z.coerce.date(),
      receivedDate: z.coerce.date().optional(),
      totalAmount: z.coerce.number(),
      invoiceNumber: z.string().optional(),
      invoiceDate: z.coerce.date().optional(),
      remark: z.string().optional(),
      items: z.array(z.object({
        itemId: z.string(),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().positive(),
        batchNumber: z.string().optional(),
        expireDate: z.coerce.date().optional(),
        qualified: z.boolean().default(true),
        remark: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { items, ...data } = input
      const delivery = await ctx.prisma.deliveryRecord.create({
        data: {
          ...data,
          items: { create: items },
        },
      })

      await checkAndTriggerAlerts(ctx.prisma, 'DELIVERY_RECORD', delivery.id, delivery)
      return delivery
    }),
})

async function checkAndTriggerAlerts(prisma: Prisma.TransactionClient | any, sourceType: string, sourceId: string, sourceData: any) {
  const rules = await prisma.alertRule.findMany({ where: { enabled: true, ruleType: sourceType } })
  const logs: any[] = []

  for (const rule of rules) {
    const conditions = rule.conditions as Record<string, any>
    let triggered = false

    if (conditions.priority && sourceData.priority >= conditions.priority) triggered = true
    if (conditions.totalAmount && sourceData.totalAmount >= conditions.totalAmount) triggered = true
    if (conditions.status && sourceData.status === conditions.status) triggered = true

    if (triggered) {
      logs.push({
        ruleId: rule.id,
        sourceType,
        sourceId,
        message: rule.description || `触发规则: ${rule.name}`,
        severity: rule.severity,
      })
    }
  }

  if (logs.length > 0) {
    await prisma.alertRuleLog.createMany({ data: logs })
  }
}
