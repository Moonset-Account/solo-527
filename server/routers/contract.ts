import { z } from 'zod';
import { protectedProcedure, legalProcedure, router } from '../trpc';
import { prisma } from '@/lib/prisma';

export const contractRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        riskId: z.string().optional(),
        checklistId: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, riskId, checklistId, status } = input;

      const where: any = {};
      if (riskId) where.riskId = riskId;
      if (checklistId) where.checklistId = checklistId;
      if (status) where.status = status;
      if (cursor) where.id = { gt: cursor };

      const items = await prisma.contract.findMany({
        take: limit + 1,
        where,
        include: {
          checklist: { select: { id: true, title: true } },
          risk: { select: { id: true, title: true } },
          reviews: {
            include: { reviewer: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 1,
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
      return prisma.contract.findUnique({
        where: { id: input.id },
        include: {
          checklist: { select: { id: true, title: true } },
          risk: { select: { id: true, title: true, riskLevel: true } },
          reviews: {
            include: { reviewer: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }),

  create: legalProcedure
    .input(
      z.object({
        version: z.string(),
        title: z.string(),
        content: z.string().optional(),
        checklistId: z.string().optional(),
        riskId: z.string().optional(),
        status: z.string().default('DRAFT'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return prisma.contract.create({
        data: {
          version: input.version,
          title: input.title,
          content: input.content,
          checklistId: input.checklistId,
          riskId: input.riskId,
          status: input.status,
          createdBy: user.id,
        },
      });
    }),

  update: legalProcedure
    .input(
      z.object({
        id: z.string(),
        version: z.string().optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.contract.update({
        where: { id: input.id },
        data: {
          version: input.version,
          title: input.title,
          content: input.content,
          status: input.status,
        },
      });
    }),

  addReview: legalProcedure
    .input(
      z.object({
        contractId: z.string(),
        opinion: z.string().min(1),
        status: z.string().default('PENDING'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return prisma.contractReview.create({
        data: {
          contractId: input.contractId,
          reviewerId: user.id,
          opinion: input.opinion,
          status: input.status,
        },
      });
    }),

  createNewVersion: legalProcedure
    .input(
      z.object({
        contractId: z.string(),
        newVersion: z.string(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.contract.findUnique({
        where: { id: input.contractId },
      });

      if (!existing) {
        throw new Error('合同不存在');
      }

      const { user } = ctx;
      return prisma.contract.create({
        data: {
          version: input.newVersion,
          title: existing.title,
          content: input.content ?? existing.content,
          checklistId: existing.checklistId,
          riskId: existing.riskId,
          status: 'DRAFT',
          createdBy: user.id,
        },
      });
    }),

  delete: legalProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.contract.delete({ where: { id: input.id } });
    }),
});
