import { z } from 'zod';
import { protectedProcedure, legalProcedure, router } from '../trpc';
import { prisma } from '@/lib/prisma';
import { RiskLevel, RiskStatus, Department } from '@prisma/client';

export const riskRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        status: z.nativeEnum(RiskStatus).optional(),
        riskLevel: z.nativeEnum(RiskLevel).optional(),
        responsibleDept: z.nativeEnum(Department).optional(),
        checklistId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { limit, cursor, status, riskLevel, responsibleDept, checklistId } = input;

      const where: any = {};
      if (user.role === 'BUSINESS') {
        where.submitterId = user.id;
      }
      if (status) where.status = status;
      if (riskLevel) where.riskLevel = riskLevel;
      if (responsibleDept) where.responsibleDept = responsibleDept;
      if (checklistId) where.checklistId = checklistId;
      if (cursor) where.id = { gt: cursor };

      const items = await prisma.risk.findMany({
        take: limit + 1,
        where,
        include: {
          submitter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          checklist: { select: { id: true, title: true } },
          _count: {
            select: {
              evidences: true,
              reviewOpinions: true,
              rectificationPlans: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.risk.findUnique({
        where: { id: input.id },
        include: {
          submitter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          checklist: { select: { id: true, title: true } },
          assessments: {
            include: { assessor: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
          evidences: {
            include: { uploader: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
          reviewOpinions: {
            include: { reviewer: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
          rectificationPlans: {
            orderBy: { createdAt: 'desc' },
          },
          contracts: true,
          alerts: true,
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        checklistId: z.string().optional(),
        title: z.string().min(1),
        description: z.string().min(1),
        responsibleDept: z.nativeEnum(Department),
        riskLevel: z.nativeEnum(RiskLevel).default('MEDIUM'),
        assigneeId: z.string().optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return prisma.risk.create({
        data: {
          checklistId: input.checklistId,
          title: input.title,
          description: input.description,
          responsibleDept: input.responsibleDept,
          riskLevel: input.riskLevel,
          submitterId: user.id,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        },
      });
    }),

  update: legalProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        riskLevel: z.nativeEnum(RiskLevel).optional(),
        status: z.nativeEnum(RiskStatus).optional(),
        responsibleDept: z.nativeEnum(Department).optional(),
        assigneeId: z.string().optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.risk.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          riskLevel: input.riskLevel,
          status: input.status,
          responsibleDept: input.responsibleDept,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(RiskStatus),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = { status: input.status };
      if (input.status === 'CLOSED') {
        data.closedAt = new Date();
      }
      return prisma.risk.update({
        where: { id: input.id },
        data,
      });
    }),

  addAssessment: legalProcedure
    .input(
      z.object({
        riskId: z.string(),
        riskLevel: z.nativeEnum(RiskLevel),
        likelihood: z.number().min(1).max(10),
        impact: z.number().min(1).max(10),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return prisma.$transaction(async (tx) => {
        const assessment = await tx.riskAssessment.create({
          data: {
            riskId: input.riskId,
            assessorId: user.id,
            riskLevel: input.riskLevel,
            likelihood: input.likelihood,
            impact: input.impact,
            description: input.description,
          },
        });

        await tx.risk.update({
          where: { id: input.riskId },
          data: { riskLevel: input.riskLevel },
        });

        return assessment;
      });
    }),

  addEvidence: protectedProcedure
    .input(
      z.object({
        riskId: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return prisma.evidence.create({
        data: {
          riskId: input.riskId,
          uploaderId: user.id,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileType: input.fileType,
          description: input.description,
        },
      });
    }),

  addReviewOpinion: legalProcedure
    .input(
      z.object({
        riskId: z.string(),
        content: z.string().min(1),
        status: z.string().default('PENDING'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return prisma.reviewOpinion.create({
        data: {
          riskId: input.riskId,
          reviewerId: user.id,
          content: input.content,
          status: input.status,
        },
      });
    }),

  addRectificationPlan: protectedProcedure
    .input(
      z.object({
        riskId: z.string(),
        description: z.string().min(1),
        actions: z.string().min(1),
        dueDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.rectificationPlan.create({
        data: {
          riskId: input.riskId,
          description: input.description,
          actions: input.actions,
          dueDate: new Date(input.dueDate),
        },
      });
    }),

  updateRectificationPlan: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
        completedAt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.rectificationPlan.update({
        where: { id: input.id },
        data: {
          status: input.status,
          completedAt: input.completedAt ? new Date(input.completedAt) : undefined,
        },
      });
    }),

  deleteEvidence: legalProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.evidence.delete({ where: { id: input.id } });
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    const where: any = {};
    if (user.role === 'BUSINESS') {
      where.submitterId = user.id;
    }

    const [
      total,
      drafts,
      submitted,
      underReview,
      rectification,
      closed,
      escalated,
      critical,
      high,
      medium,
      low,
    ] = await Promise.all([
      prisma.risk.count({ where }),
      prisma.risk.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.risk.count({ where: { ...where, status: 'SUBMITTED' } }),
      prisma.risk.count({ where: { ...where, status: 'UNDER_REVIEW' } }),
      prisma.risk.count({ where: { ...where, status: 'RECTIFICATION' } }),
      prisma.risk.count({ where: { ...where, status: 'CLOSED' } }),
      prisma.risk.count({ where: { ...where, status: 'ESCALATED' } }),
      prisma.risk.count({ where: { ...where, riskLevel: 'CRITICAL' } }),
      prisma.risk.count({ where: { ...where, riskLevel: 'HIGH' } }),
      prisma.risk.count({ where: { ...where, riskLevel: 'MEDIUM' } }),
      prisma.risk.count({ where: { ...where, riskLevel: 'LOW' } }),
    ]);

    const overdue = await prisma.risk.count({
      where: {
        ...where,
        dueDate: { lt: new Date() },
        status: { notIn: ['CLOSED'] },
      },
    });

    return {
      total,
      drafts,
      submitted,
      underReview,
      rectification,
      closed,
      escalated,
      critical,
      high,
      medium,
      low,
      overdue,
    };
  }),
});
