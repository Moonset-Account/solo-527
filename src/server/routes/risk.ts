import { z } from 'zod'
import { protectedProcedure, createTRPCRouter } from '../trpc'

export const riskRouter = createTRPCRouter({
  listRisks: protectedProcedure
    .input(z.object({
      supplierId: z.string().optional(),
      level: z.string().optional(),
      resolved: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.supplierRisk.findMany({
        where: {
          ...(input.supplierId && { supplierId: input.supplierId }),
          ...(input.level && { level: input.level as any }),
          ...(input.resolved !== undefined && { resolved: input.resolved }),
        },
        include: {
          supplier: true,
          creator: { select: { name: true } },
          boardEntry: true,
        },
        orderBy: [
          { resolved: 'asc' },
          { level: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 300,
      })
    }),

  createRisk: protectedProcedure
    .input(z.object({
      supplierId: z.string(),
      title: z.string(),
      description: z.string(),
      level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      sourceType: z.string(),
      sourceId: z.string().optional(),
      impactAnalysis: z.string().optional(),
      mitigationPlan: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { sourceId, ...data } = input
      const risk = await ctx.prisma.supplierRisk.create({
        data: {
          ...data,
          creatorId: ctx.user.id,
        },
      })

      if (input.level === 'HIGH' || input.level === 'CRITICAL') {
        await ctx.prisma.riskBoardEntry.create({
          data: {
            supplierId: risk.supplierId,
            riskId: risk.id,
            title: risk.title,
            level: risk.level,
            sourceType: risk.sourceType,
            description: risk.description,
          },
        })
      }

      return risk
    }),

  updateRisk: protectedProcedure
    .input(z.object({
      id: z.string(),
      description: z.string().optional(),
      level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      impactAnalysis: z.string().optional(),
      mitigationPlan: z.string().optional(),
      resolved: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const risk = await ctx.prisma.supplierRisk.update({
        where: { id },
        data: {
          ...data,
          resolvedDate: data.resolved ? new Date() : undefined,
        },
        include: { boardEntry: true },
      })

      if (data.resolved && risk.boardEntry) {
        await ctx.prisma.riskBoardEntry.update({
          where: { riskId: id },
          data: { status: 'RESOLVED' },
        })
      }

      return risk
    }),

  listBoardEntries: protectedProcedure
    .input(z.object({
      supplierId: z.string().optional(),
      level: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.riskBoardEntry.findMany({
        where: {
          ...(input.supplierId && { supplierId: input.supplierId }),
          ...(input.level && { level: input.level as any }),
          ...(input.status && { status: input.status }),
        },
        include: {
          supplier: true,
          risk: true,
          approver: { select: { name: true } },
        },
        orderBy: [
          { level: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 300,
      })
    }),

  approveBoardEntry: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.riskBoardEntry.update({
        where: { id: input.id },
        data: {
          status: 'APPROVED',
          approverId: ctx.user.id,
          approvedDate: new Date(),
        },
      })
    }),

  supplierRiskStats: protectedProcedure.query(async ({ ctx }) => {
    const risks = await ctx.prisma.supplierRisk.groupBy({
      by: ['supplierId', 'level', 'resolved'],
      _count: { id: true },
    })

    const suppliers = await ctx.prisma.supplier.findMany({
      select: { id: true, name: true, rating: true },
    })

    const stats = suppliers.map(s => {
      const supplierRisks = risks.filter(r => r.supplierId === s.id)
      return {
        supplier: s,
        total: supplierRisks.reduce((sum, r) => sum + r._count.id, 0),
        unresolved: supplierRisks.filter(r => !r.resolved).reduce((sum, r) => sum + r._count.id, 0),
        critical: supplierRisks.filter(r => r.level === 'CRITICAL' && !r.resolved).reduce((sum, r) => sum + r._count.id, 0),
        high: supplierRisks.filter(r => r.level === 'HIGH' && !r.resolved).reduce((sum, r) => sum + r._count.id, 0),
        medium: supplierRisks.filter(r => r.level === 'MEDIUM' && !r.resolved).reduce((sum, r) => sum + r._count.id, 0),
        low: supplierRisks.filter(r => r.level === 'LOW' && !r.resolved).reduce((sum, r) => sum + r._count.id, 0),
      }
    })

    return stats.sort((a, b) => b.unresolved - a.unresolved)
  }),

  listAlertRules: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.alertRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { logs: true } } },
    })
  }),

  createAlertRule: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      ruleType: z.string(),
      conditions: z.record(z.any()),
      actions: z.record(z.any()),
      enabled: z.boolean().default(true),
      severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).default('WARNING'),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.alertRule.create({ data: input })
    }),

  toggleAlertRule: protectedProcedure
    .input(z.object({
      id: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.alertRule.update({
        where: { id: input.id },
        data: { enabled: input.enabled },
      })
    }),

  listAlertLogs: protectedProcedure
    .input(z.object({
      sourceType: z.string().optional(),
      read: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.alertRuleLog.findMany({
        where: {
          ...(input.sourceType && { sourceType: input.sourceType }),
          ...(input.read !== undefined && { read: input.read }),
        },
        include: { rule: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
    }),

  markAlertRead: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.alertRuleLog.update({
        where: { id: input },
        data: { read: true },
      })
    }),

  listUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }),

  updateUserRole: protectedProcedure
    .input(z.object({
      id: z.string(),
      role: z.enum(['EMPLOYEE', 'PROCUREMENT_MANAGER', 'SUPPLIER_COORDINATOR', 'APPROVER', 'ADMIN']),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.id },
        data: { role: input.role },
      })
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const [
      supplierCount,
      activeAgreements,
      pendingReconciliations,
      pendingPayments,
      unresolvedRisks,
      deliveryDiscrepancies,
      paymentDiscrepancies,
      unreadAlerts,
    ] = await Promise.all([
      ctx.prisma.supplier.count({ where: { status: true } }),
      ctx.prisma.frameworkAgreement.count({ where: { status: 'ACTIVE' } }),
      ctx.prisma.reconciliation.count({ where: { status: 'PENDING' } }),
      ctx.prisma.paymentSuggestion.count({ where: { status: 'RECOMMENDED' } }),
      ctx.prisma.supplierRisk.count({ where: { resolved: false } }),
      ctx.prisma.deliveryDiscrepancy.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      ctx.prisma.paymentDiscrepancy.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      ctx.prisma.alertRuleLog.count({ where: { read: false } }),
    ])

    return {
      supplierCount,
      activeAgreements,
      pendingReconciliations,
      pendingPayments,
      unresolvedRisks,
      deliveryDiscrepancies,
      paymentDiscrepancies,
      unreadAlerts,
    }
  }),
})
