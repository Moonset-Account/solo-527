import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, requireRole } from '../trpc';
import { UserRole, ProjectStatus } from '@prisma/client';
import { calculateBudgetAlert } from '~/lib/utils';

export const phaseRouter = createTRPCRouter({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.projectPhase.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: 'asc' },
      });
    }),

  create: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        startDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.projectPhase.updateMany({
        where: { projectId: input.projectId, isCurrent: true },
        data: { isCurrent: false },
      });

      const phase = await ctx.prisma.projectPhase.create({
        data: {
          ...input,
          isCurrent: true,
        },
      });

      await ctx.prisma.changeHistory.create({
        data: {
          projectId: input.projectId,
          entityType: 'ProjectPhase',
          entityId: phase.id,
          fieldName: 'current_phase',
          oldValue: null,
          newValue: input.name,
          changeType: 'UPDATE',
          createdById: ctx.user?.id,
          responsibleId: ctx.user?.id,
          remark: `进入新阶段: ${input.name}`,
        },
      });

      return phase;
    }),

  complete: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))
    .input(
      z.object({
        id: z.string(),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const phase = await ctx.prisma.projectPhase.update({
        where: { id: input.id },
        data: {
          completedAt: new Date(),
          remark: input.remark,
        },
        include: { project: true },
      });

      await ctx.prisma.changeHistory.create({
        data: {
          projectId: phase.projectId,
          entityType: 'ProjectPhase',
          entityId: phase.id,
          fieldName: 'completed',
          oldValue: 'false',
          newValue: 'true',
          changeType: 'UPDATE',
          createdById: ctx.user?.id,
          responsibleId: ctx.user?.id,
          remark: input.remark ?? `阶段完成: ${phase.name}`,
        },
      });

      return phase;
    }),

  updateProjectStatus: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))
    .input(
      z.object({
        projectId: z.string(),
        status: z.nativeEnum(ProjectStatus),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const old = await ctx.prisma.project.findUnique({ where: { id: input.projectId } });

      const project = await ctx.prisma.project.update({
        where: { id: input.projectId },
        data: { status: input.status },
      });

      if (old && old.status !== input.status) {
        await ctx.prisma.changeHistory.create({
          data: {
            projectId: input.projectId,
            entityType: 'Project',
            entityId: input.projectId,
            fieldName: 'status',
            oldValue: old.status,
            newValue: input.status,
            changeType: 'UPDATE',
            createdById: ctx.user?.id,
            responsibleId: ctx.user?.id,
            remark: input.remark,
          },
        });
      }

      return project;
    }),

  recordBudgetChange: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))
    .input(
      z.object({
        projectId: z.string(),
        newBudget: z.number(),
        reason: z.string(),
        responsibleId: z.string().optional(),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) throw new Error('项目不存在');

      const oldBudget = project.totalBudget.toNumber();
      const changeAmount = input.newBudget - oldBudget;
      const changePercent = oldBudget > 0 ? (changeAmount / oldBudget) * 100 : 0;
      const isAbnormal = changePercent > 10 || changePercent < -10 || input.newBudget < project.actualCost.toNumber();

      const actualCost = project.actualCost.toNumber();
      const usedPercent = input.newBudget > 0 ? (actualCost / input.newBudget) * 100 : 0;
      const alertLevel = calculateBudgetAlert(usedPercent);

      const budgetChange = await ctx.prisma.budgetChange.create({
        data: {
          projectId: input.projectId,
          oldBudget,
          newBudget: input.newBudget,
          changeAmount,
          changePercent,
          reason: input.reason,
          isAbnormal,
          alertLevel,
          responsibleId: input.responsibleId ?? ctx.user?.id,
          remark: input.remark,
          createdById: ctx.user?.id,
        },
      });

      await ctx.prisma.project.update({
        where: { id: input.projectId },
        data: {
          totalBudget: input.newBudget,
          budgetUsedPercent: usedPercent,
          budgetAlertLevel: alertLevel,
        },
      });

      await ctx.prisma.changeHistory.create({
        data: {
          projectId: input.projectId,
          entityType: 'Budget',
          entityId: budgetChange.id,
          fieldName: 'totalBudget',
          oldValue: oldBudget.toString(),
          newValue: input.newBudget.toString(),
          changeType: 'UPDATE',
          createdById: ctx.user?.id,
          responsibleId: input.responsibleId ?? ctx.user?.id,
          remark: `${isAbnormal ? '[异常] ' : ''}${input.reason}`,
        },
      });

      return budgetChange;
    }),

  listChangeHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        entityType: z.string().optional(),
        fieldName: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.changeHistory.findMany({
        where: {
          projectId: input.projectId,
          entityType: input.entityType,
          fieldName: input.fieldName,
        },
        include: {
          responsible: true,
          createdBy: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }),

  listAllBudgetChanges: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.budgetChange.findMany({
      where: { isAbnormal: true },
      include: {
        project: { select: { id: true, name: true, code: true } },
        responsible: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }),
});
