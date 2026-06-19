import { z } from 'zod'
import { protectedProcedure, createTRPCRouter, requireRole } from '../trpc'
import type { RiskLevel } from '@prisma/client'
import type { Prisma } from '@prisma/client'

export const reconciliationRouter = createTRPCRouter({
  listReconciliations: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      period: z.string().optional(),
      supplierId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.reconciliation.findMany({
        where: {
          ...(input.status && { status: input.status as any }),
          ...(input.period && { period: input.period }),
          ...(input.supplierId && { delivery: { supplierId: input.supplierId } }),
        },
        include: {
          delivery: { include: { supplier: true } },
          user: { select: { name: true } },
          payments: true,
          discrepancies: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
    }),

  listReconciliationsAvailableForPayment: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.reconciliation.findMany({
        where: {
          status: { in: ['MATCHED', 'RESOLVED'] },
          payments: { none: {} },
        },
        include: {
          delivery: { include: { supplier: true } },
        },
        orderBy: { period: 'desc' },
        take: 200,
      })
    }),

  createReconciliation: protectedProcedure
    .input(z.object({
      deliveryId: z.string(),
      period: z.string().regex(/^\d{4}-\d{2}$/),
      expectedAmount: z.coerce.number(),
      actualAmount: z.coerce.number(),
      differenceNote: z.string().optional(),
      remark: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const differenceAmount = Math.abs(input.expectedAmount - input.actualAmount)
      const hasDiscrepancy = differenceAmount > 0.01

      const reconciliation = await ctx.prisma.reconciliation.create({
        data: {
          ...input,
          userId: ctx.user.id,
          differenceAmount,
          status: hasDiscrepancy ? 'DISCREPANCY' : 'MATCHED',
          reconciliationDate: new Date(),
        },
      })

      if (hasDiscrepancy) {
        const type = input.expectedAmount > input.actualAmount ? 'QUANTITY' : 'PRICE'
        await ctx.prisma.deliveryDiscrepancy.create({
          data: {
            reconciliationId: reconciliation.id,
            type,
            description: `对账发现金额差异，预期: ¥${input.expectedAmount}，实际: ¥${input.actualAmount}`,
            expectedValue: String(input.expectedAmount),
            actualValue: String(input.actualAmount),
            impactAmount: differenceAmount,
          },
        })
      }

      return reconciliation
    }),

  resolveDiscrepancy: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['INVESTIGATING', 'CONFIRMED', 'RESOLVED', 'CLOSED']),
      resolution: z.string().optional(),
      createRisk: z.boolean().default(false),
      riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, createRisk, riskLevel, ...updateData } = input

      const discrepancy = await ctx.prisma.deliveryDiscrepancy.update({
        where: { id },
        data: {
          ...updateData,
          resolutionDate: updateData.status === 'RESOLVED' ? new Date() : undefined,
          handlerId: ctx.user.id,
        },
        include: { reconciliation: { include: { delivery: true } } },
      })

      if (discrepancy.reconciliation) {
        const allResolved = await ctx.prisma.deliveryDiscrepancy.findMany({
          where: { reconciliationId: discrepancy.reconciliationId },
        })
        const isAllClosed = allResolved.every(d => d.status === 'CLOSED' || d.status === 'RESOLVED')

        if (isAllClosed) {
          await ctx.prisma.reconciliation.update({
            where: { id: discrepancy.reconciliationId },
            data: { status: 'RESOLVED' },
          })
        }
      }

      if (createRisk && riskLevel) {
        const risk = await ctx.prisma.supplierRisk.create({
          data: {
            supplierId: discrepancy.reconciliation.delivery.supplierId,
            title: `交付差异-${discrepancy.type}`,
            description: discrepancy.description,
            level: riskLevel,
            sourceType: 'DELIVERY_DISCREPANCY',
            deliveryDiscrepancyId: discrepancy.id,
            creatorId: ctx.user.id,
            impactAnalysis: `影响金额: ¥${discrepancy.impactAmount || 0}`,
          },
        })

        await ctx.prisma.deliveryDiscrepancy.update({
          where: { id },
          data: { risk: { connect: { id: risk.id } } },
        })
      }

      return discrepancy
    }),

  listPaymentSuggestions: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      supplierId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.paymentSuggestion.findMany({
        where: {
          ...(input.status && { status: input.status as any }),
          ...(input.supplierId && { supplierId: input.supplierId }),
        },
        include: {
          supplier: true,
          reconciliation: { include: { delivery: true } },
          approver: { select: { name: true } },
          discrepancies: true,
        },
        orderBy: { paymentDueDate: 'asc' },
        take: 200,
      })
    }),

  createPaymentSuggestion: protectedProcedure
    .input(z.object({
      reconciliationId: z.string(),
      supplierId: z.string(),
      suggestedAmount: z.coerce.number().positive(),
      paymentDueDate: z.coerce.date(),
      remark: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.paymentSuggestion.create({
        data: {
          ...input,
          suggestedDate: new Date(),
          status: 'RECOMMENDED',
        },
      })

      await ctx.prisma.reconciliation.update({
        where: { id: input.reconciliationId },
        data: { status: 'MATCHED' },
      })

      return payment
    }),

  approvePayment: requireRole('APPROVER', 'ADMIN')
    .input(z.object({
      id: z.string(),
      status: z.enum(['APPROVED', 'DISPUTED']),
      remark: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.paymentSuggestion.update({
        where: { id: input.id },
        data: {
          status: input.status,
          approverId: ctx.user.id,
          approvalDate: new Date(),
          remark: input.remark,
        },
      })
    }),

  listPaymentDiscrepancies: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.paymentDiscrepancy.findMany({
        where: input.status ? { status: input.status as any } : undefined,
        include: {
          payment: { include: { supplier: true, reconciliation: true } },
          reviewer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
    }),

  createPaymentDiscrepancy: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
      expectedAmount: z.coerce.number(),
      actualAmount: z.coerce.number(),
      differenceAmount: z.coerce.number(),
      reason: z.string(),
      coordinatorNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { paymentId, ...data } = input
      const discrepancy = await ctx.prisma.paymentDiscrepancy.create({
        data: {
          ...data,
          status: 'OPEN',
          payment: {
            connect: { id: paymentId },
          },
        },
      })

      await checkAndTriggerAlerts(ctx.prisma, 'PAYMENT_DISCREPANCY', discrepancy.id, discrepancy)

      return discrepancy
    }),

  reviewPaymentDiscrepancy: requireRole('APPROVER', 'ADMIN')
    .input(z.object({
      id: z.string(),
      status: z.enum(['INVESTIGATING', 'CONFIRMED', 'RESOLVED', 'CLOSED']),
      reviewNote: z.string(),
      syncToRiskBoard: z.boolean().default(false),
      riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, syncToRiskBoard, riskLevel, ...updateData } = input

      const discrepancy = await ctx.prisma.paymentDiscrepancy.update({
        where: { id },
        data: {
          ...updateData,
          reviewerId: ctx.user.id,
          reviewDate: new Date(),
          syncedToRiskBoard: syncToRiskBoard,
        },
        include: { payment: true },
      })

      if (syncToRiskBoard && riskLevel) {
        const risk = await ctx.prisma.supplierRisk.upsert({
          where: { paymentDiscrepancyId: id },
          update: {
            level: riskLevel,
            description: updateData.reviewNote,
          },
          create: {
            supplierId: discrepancy.payment.supplierId,
            title: `付款差异确认`,
            description: updateData.reviewNote,
            level: riskLevel,
            sourceType: 'PAYMENT_DISCREPANCY',
            paymentDiscrepancyId: id,
            creatorId: ctx.user.id,
            impactAnalysis: `差异金额: ¥${discrepancy.differenceAmount}`,
          },
        })

        await ctx.prisma.paymentDiscrepancy.update({
          where: { id },
          data: { risk: { connect: { id: risk.id } } },
        })

        await ctx.prisma.riskBoardEntry.create({
          data: {
            supplierId: discrepancy.payment.supplierId,
            riskId: risk.id,
            title: risk.title,
            level: risk.level,
            sourceType: 'PAYMENT_DISCREPANCY',
            description: updateData.reviewNote,
            approverId: ctx.user.id,
            approvedDate: new Date(),
          },
        })
      }

      return discrepancy
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
    if (conditions.amountThreshold && sourceData.totalAmount >= conditions.amountThreshold) triggered = true
    if (conditions.differenceAmount && sourceData.differenceAmount >= conditions.differenceAmount) triggered = true
    if (conditions.status && sourceData.status === conditions.status) triggered = true
    if (sourceType === 'PAYMENT_DISCREPANCY') triggered = true

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
