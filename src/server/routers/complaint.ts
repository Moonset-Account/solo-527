import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, requireRole } from '../trpc';
import { ComplaintStatus, ComplaintPriority, RiskLevel, UserRole } from '@prisma/client';

export const complaintRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(ComplaintStatus).optional(),
        projectId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.complaint.findMany({
        where: {
          status: input.status,
          projectId: input.projectId,
        },
        include: {
          project: { select: { id: true, name: true, code: true } },
          assignedTo: true,
          decorationCompany: true,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 50,
      });
    }),

  listOpen: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.complaint.findMany({
      where: { status: { not: ComplaintStatus.RESOLVED } },
      include: {
        project: { select: { id: true, name: true, code: true } },
        assignedTo: true,
        decorationCompany: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string(),
        priority: z.nativeEnum(ComplaintPriority).default(ComplaintPriority.MEDIUM),
        clientName: z.string(),
        clientContact: z.string(),
        assignedToId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
        include: { decorationCompany: true },
      });

      const shouldNotifyBoss =
        input.priority === ComplaintPriority.HIGH ||
        input.priority === ComplaintPriority.URGENT;

      const complaint = await ctx.prisma.complaint.create({
        data: {
          ...input,
          decorationCompanyId: project?.decorationCompanyId,
          bossNotified: shouldNotifyBoss,
          notifiedAt: shouldNotifyBoss ? new Date() : null,
        },
      });

      await ctx.prisma.changeHistory.create({
        data: {
          projectId: input.projectId,
          entityType: 'Complaint',
          entityId: complaint.id,
          fieldName: 'created',
          oldValue: null,
          newValue: `客户投诉创建: ${input.title}${shouldNotifyBoss ? '（已通知装修公司老板）' : ''}`,
          changeType: 'CREATE',
          createdById: ctx.user?.id,
          responsibleId: input.assignedToId ?? ctx.user?.id,
        },
      });

      return complaint;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ComplaintStatus),
        resolution: z.string().optional(),
        assignedToId: z.string().optional(),
        notifyBoss: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, resolution, assignedToId, notifyBoss } = input;
      const old = await ctx.prisma.complaint.findUnique({ where: { id } });

      const complaint = await ctx.prisma.complaint.update({
        where: { id },
        data: {
          status,
          resolution,
          assignedToId,
          resolvedAt: status === ComplaintStatus.RESOLVED ? new Date() : null,
          bossNotified: notifyBoss ? true : undefined,
          notifiedAt: notifyBoss ? new Date() : undefined,
        },
      });

      if (old && old.status !== status) {
        await ctx.prisma.changeHistory.create({
          data: {
            projectId: complaint.projectId,
            entityType: 'Complaint',
            entityId: complaint.id,
            fieldName: 'status',
            oldValue: old.status,
            newValue: status,
            changeType: 'UPDATE',
            createdById: ctx.user?.id,
            responsibleId: assignedToId ?? ctx.user?.id,
            remark: resolution,
          },
        });
      }

      if (notifyBoss && !old?.bossNotified) {
        await ctx.prisma.changeHistory.create({
          data: {
            projectId: complaint.projectId,
            entityType: 'Complaint',
            entityId: complaint.id,
            fieldName: 'bossNotified',
            oldValue: 'false',
            newValue: 'true',
            changeType: 'UPDATE',
            createdById: ctx.user?.id,
            responsibleId: ctx.user?.id,
            remark: '已通知装修公司老板',
          },
        });
      }

      return complaint;
    }),

  listRisks: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        reportMonth: z.string().optional(),
        isResolved: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contractRisk.findMany({
        where: {
          projectId: input.projectId,
          reportMonth: input.reportMonth,
          isResolved: input.isResolved,
        },
        include: {
          project: { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ riskLevel: 'desc' }, { createdAt: 'desc' }],
      });
    }),

  createRisk: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string(),
        riskLevel: z.nativeEnum(RiskLevel).default(RiskLevel.MEDIUM),
        category: z.string(),
        mitigation: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const risk = await ctx.prisma.contractRisk.create({
        data: {
          ...input,
          reportMonth,
        },
      });

      await ctx.prisma.changeHistory.create({
        data: {
          projectId: input.projectId,
          entityType: 'ContractRisk',
          entityId: risk.id,
          fieldName: 'created',
          oldValue: null,
          newValue: `合同风险录入: ${input.title} (${input.riskLevel})`,
          changeType: 'CREATE',
          createdById: ctx.user?.id,
          responsibleId: ctx.user?.id,
        },
      });

      return risk;
    }),

  resolveRisk: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        mitigation: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, mitigation } = input;
      const old = await ctx.prisma.contractRisk.findUnique({ where: { id } });

      const risk = await ctx.prisma.contractRisk.update({
        where: { id },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          mitigation,
        },
      });

      if (old && !old.isResolved) {
        await ctx.prisma.changeHistory.create({
          data: {
            projectId: risk.projectId,
            entityType: 'ContractRisk',
            entityId: risk.id,
            fieldName: 'isResolved',
            oldValue: 'false',
            newValue: 'true',
            changeType: 'UPDATE',
            createdById: ctx.user?.id,
            responsibleId: ctx.user?.id,
            remark: mitigation,
          },
        });
      }

      return risk;
    }),

  getMonthlyReport: protectedProcedure
    .input(z.object({ month: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const month = input.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [risks, complaintsStats, projectStats] = await Promise.all([
        ctx.prisma.contractRisk.findMany({
          where: { reportMonth: month },
          include: { project: { select: { name: true, code: true } } },
          orderBy: { riskLevel: 'desc' },
        }),
        ctx.prisma.$queryRaw`
          SELECT 
            COUNT(*)::int as total,
            COUNT(*) FILTER (WHERE status = 'OPEN')::int as open,
            COUNT(*) FILTER (WHERE status = 'PROCESSING')::int as processing,
            COUNT(*) FILTER (WHERE status = 'RESOLVED')::int as resolved,
            COUNT(*) FILTER (WHERE "bossNotified" = true)::int as boss_notified
          FROM "Complaint"
          WHERE to_char("createdAt", 'YYYY-MM') = ${month}
        `,
        ctx.prisma.$queryRaw`
          SELECT 
            COUNT(*)::int as total,
            COUNT(*) FILTER (WHERE "budgetAlertLevel" != 'NORMAL')::int as abnormal_budget,
            SUM(CASE WHEN "budgetAlertLevel" = 'CRITICAL' THEN 1 ELSE 0 END)::int as critical_budget
          FROM "Project"
        `,
      ]);

      return {
        month,
        risks,
        complaintsStats,
        projectStats,
      };
    }),
});
