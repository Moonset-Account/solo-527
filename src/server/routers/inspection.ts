import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, requireRole } from '../trpc';
import { InspectionStatus, AcceptanceStatus, UserRole } from '@prisma/client';

export const inspectionRouter = createTRPCRouter({
  listPending: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.inspectionTask.findMany({
      where: {
        status: { in: [InspectionStatus.PENDING, InspectionStatus.IN_PROGRESS] },
      },
      include: {
        project: {
          select: { id: true, name: true, code: true, address: true },
        },
        inspector: true,
      },
      orderBy: { scheduledDate: 'asc' },
      take: 20,
    });
  }),

  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.inspectionTask.findMany({
        where: { projectId: input.projectId },
        include: { inspector: true },
        orderBy: { scheduledDate: 'desc' },
      });
    }),

  create: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.DESIGNER]))
    .input(
      z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        scheduledDate: z.date(),
        inspectorId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inspection = await ctx.prisma.inspectionTask.create({
        data: input,
      });

      await ctx.prisma.changeHistory.create({
        data: {
          projectId: input.projectId,
          entityType: 'InspectionTask',
          entityId: inspection.id,
          fieldName: 'created',
          oldValue: null,
          newValue: `巡检任务创建: ${input.title}`,
          changeType: 'CREATE',
          createdById: ctx.user?.id,
          responsibleId: ctx.user?.id,
        },
      });

      return inspection;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(InspectionStatus),
        result: z.string().optional(),
        issues: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, result, issues } = input;
      const old = await ctx.prisma.inspectionTask.findUnique({ where: { id } });

      const inspection = await ctx.prisma.inspectionTask.update({
        where: { id },
        data: {
          status,
          result,
          issues,
          completedDate:
            status === InspectionStatus.COMPLETED || status === InspectionStatus.FAILED
              ? new Date()
              : undefined,
        },
      });

      if (old && old.status !== status) {
        await ctx.prisma.changeHistory.create({
          data: {
            projectId: inspection.projectId,
            entityType: 'InspectionTask',
            entityId: inspection.id,
            fieldName: 'status',
            oldValue: old.status,
            newValue: status,
            changeType: 'UPDATE',
            createdById: ctx.user?.id,
            responsibleId: ctx.user?.id,
          },
        });
      }

      return inspection;
    }),

  listAcceptancesPending: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.acceptance.findMany({
      where: {
        status: { in: [AcceptanceStatus.PENDING, AcceptanceStatus.RECTIFYING] },
      },
      include: {
        project: {
          select: { id: true, name: true, code: true, address: true },
        },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 20,
    });
  }),

  listAcceptancesByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.acceptance.findMany({
        where: { projectId: input.projectId },
        orderBy: { scheduledDate: 'desc' },
      });
    }),

  createAcceptance: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.DESIGNER]))
    .input(
      z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        scheduledDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const acceptance = await ctx.prisma.acceptance.create({
        data: input,
      });

      await ctx.prisma.changeHistory.create({
        data: {
          projectId: input.projectId,
          entityType: 'Acceptance',
          entityId: acceptance.id,
          fieldName: 'created',
          oldValue: null,
          newValue: `验收任务创建: ${input.title}`,
          changeType: 'CREATE',
          createdById: ctx.user?.id,
          responsibleId: ctx.user?.id,
        },
      });

      return acceptance;
    }),

  updateAcceptanceStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(AcceptanceStatus),
        feedback: z.string().optional(),
        passedItems: z.array(z.any()).optional(),
        rectifyItems: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, feedback, passedItems, rectifyItems } = input;
      const old = await ctx.prisma.acceptance.findUnique({ where: { id } });

      const acceptance = await ctx.prisma.acceptance.update({
        where: { id },
        data: {
          status,
          feedback,
          passedItems,
          rectifyItems,
          completedDate: status === AcceptanceStatus.PASSED ? new Date() : undefined,
        },
      });

      if (old && old.status !== status) {
        await ctx.prisma.changeHistory.create({
          data: {
            projectId: acceptance.projectId,
            entityType: 'Acceptance',
            entityId: acceptance.id,
            fieldName: 'status',
            oldValue: old.status,
            newValue: status,
            changeType: 'UPDATE',
            createdById: ctx.user?.id,
            responsibleId: ctx.user?.id,
            remark: feedback,
          },
        });
      }

      return acceptance;
    }),

  listDesignPlans: protectedProcedure
    .input(z.object({ projectId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.designPlan.findMany({
        where: input.projectId ? { projectId: input.projectId } : undefined,
        include: {
          project: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  createDesignPlan: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.DESIGNER]))
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        version: z.string(),
        fileUrl: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.designPlan.updateMany({
        where: { projectId: input.projectId, isActive: true },
        data: { isActive: false },
      });

      return ctx.prisma.designPlan.create({
        data: { ...input, isActive: true, approvedAt: new Date() },
      });
    }),
});
