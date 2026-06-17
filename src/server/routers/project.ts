import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, requireRole } from '../trpc';
import { ProjectStatus, BudgetAlertLevel, UserRole } from '@prisma/client';
import { calculateBudgetAlert } from '~/lib/utils';

export const projectRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(ProjectStatus).optional(),
        designerId: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const projects = await ctx.prisma.project.findMany({
        where: {
          status: input.status,
          designerId: input.designerId,
          OR: input.search
            ? [
                { name: { contains: input.search } },
                { code: { contains: input.search } },
                { clientName: { contains: input.search } },
                { address: { contains: input.search } },
              ]
            : undefined,
        },
        include: {
          designer: true,
          projectManager: true,
          phases: { where: { isCurrent: true } },
          inspections: {
            where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
            take: 3,
            orderBy: { scheduledDate: 'asc' },
          },
          acceptances: {
            where: { status: { in: ['PENDING', 'RECTIFYING'] } },
            take: 3,
            orderBy: { scheduledDate: 'asc' },
          },
          designPlans: { where: { isActive: true } },
          budgetChanges: {
            where: { isAbnormal: true, alertLevel: { in: ['WARNING', 'CRITICAL'] } },
            include: { responsible: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              complaints: { where: { status: { not: 'RESOLVED' } } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
      return projects;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.project.findUnique({
        where: { id: input.id },
        include: {
          designer: true,
          projectManager: true,
          decorationCompany: true,
          phases: { orderBy: { createdAt: 'asc' } },
          quotations: { orderBy: { version: 'desc' } },
          extraItems: { orderBy: { createdAt: 'desc' } },
          budgetChanges: {
            include: { responsible: true, createdBy: true },
            orderBy: { createdAt: 'desc' },
          },
          inspections: {
            include: { inspector: true },
            orderBy: { scheduledDate: 'desc' },
          },
          acceptances: { orderBy: { scheduledDate: 'desc' } },
          designPlans: { orderBy: { createdAt: 'desc' } },
          complaints: {
            include: { assignedTo: true, decorationCompany: true },
            orderBy: { createdAt: 'desc' },
          },
          contractRisks: { orderBy: { createdAt: 'desc' } },
          changeHistories: {
            include: { responsible: true, createdBy: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });
    }),

  create: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))
    .input(
      z.object({
        name: z.string(),
        clientName: z.string(),
        clientPhone: z.string(),
        clientEmail: z.string().optional(),
        address: z.string(),
        area: z.number().optional(),
        totalBudget: z.number().default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        designerId: z.string().optional(),
        projectManagerId: z.string().optional(),
        decorationCompanyId: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const code = `P${Date.now().toString().slice(-8)}`;
      const project = await ctx.prisma.project.create({
        data: {
          ...input,
          code,
          phases: {
            create: {
              name: '项目启动',
              isCurrent: true,
              startDate: new Date(),
            },
          },
          changeHistories: {
            create: {
              entityType: 'Project',
              entityId: '',
              fieldName: 'created',
              oldValue: null,
              newValue: 'created',
              changeType: 'CREATE',
              createdById: ctx.user?.id,
              responsibleId: ctx.user?.id,
            },
          },
        },
        include: {
          changeHistories: true,
        },
      });

      await ctx.prisma.changeHistory.update({
        where: { id: project.changeHistories[0].id },
        data: { entityId: project.id },
      });

      return project;
    }),

  update: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ProjectStatus).optional(),
        designerId: z.string().optional(),
        projectManagerId: z.string().optional(),
        totalBudget: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const oldProject = await ctx.prisma.project.findUnique({ where: { id } });

      const updates: Array<{ field: string; old: string | null; new: string }> = [];

      if (data.status && oldProject && oldProject.status !== data.status) {
        updates.push({ field: 'status', old: oldProject.status, new: data.status });
      }
      if (data.totalBudget !== undefined && oldProject && oldProject.totalBudget.toNumber() !== data.totalBudget) {
        updates.push({
          field: 'totalBudget',
          old: oldProject.totalBudget.toString(),
          new: data.totalBudget.toString(),
        });
      }
      if (data.designerId !== undefined && oldProject && oldProject.designerId !== data.designerId) {
        updates.push({ field: 'designerId', old: oldProject.designerId, new: data.designerId ?? '' });
      }
      if (data.projectManagerId !== undefined && oldProject && oldProject.projectManagerId !== data.projectManagerId) {
        updates.push({ field: 'projectManagerId', old: oldProject.projectManagerId, new: data.projectManagerId ?? '' });
      }

      const actualCost = oldProject?.actualCost.toNumber() ?? 0;
      const totalBudget = data.totalBudget ?? oldProject?.totalBudget.toNumber() ?? 0;
      const usedPercent = totalBudget > 0 ? (actualCost / totalBudget) * 100 : 0;

      const project = await ctx.prisma.project.update({
        where: { id },
        data: {
          ...data,
          budgetUsedPercent: usedPercent,
          budgetAlertLevel: calculateBudgetAlert(usedPercent),
        },
      });

      if (updates.length > 0) {
        await ctx.prisma.changeHistory.createMany({
          data: updates.map((u) => ({
            projectId: id,
            entityType: 'Project',
            entityId: id,
            fieldName: u.field,
            oldValue: u.old,
            newValue: u.new,
            changeType: 'UPDATE',
            createdById: ctx.user?.id,
            responsibleId: ctx.user?.id,
          })),
        });
      }

      return project;
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalProjects, abnormalBudgets, pendingInspections, pendingAcceptances, openComplaints] =
      await Promise.all([
        ctx.prisma.project.count(),
        ctx.prisma.project.count({
          where: { budgetAlertLevel: { in: [BudgetAlertLevel.WARNING, BudgetAlertLevel.CRITICAL] } },
        }),
        ctx.prisma.inspectionTask.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
        ctx.prisma.acceptance.count({ where: { status: { in: ['PENDING', 'RECTIFYING'] } } }),
        ctx.prisma.complaint.count({ where: { status: { not: 'RESOLVED' } } }),
      ]);

    return {
      totalProjects,
      abnormalBudgets,
      pendingInspections,
      pendingAcceptances,
      openComplaints,
    };
  }),

  getAbnormalBudgetList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.budgetChange.findMany({
      where: { isAbnormal: true },
      include: {
        project: true,
        responsible: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }),
});
