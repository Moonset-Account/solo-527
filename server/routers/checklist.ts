import { z } from 'zod';
import { protectedProcedure, legalProcedure, router } from '../trpc';
import { prisma } from '@/lib/prisma';
import { ChecklistCategory, Department, RiskStatus } from '@prisma/client';

const checklistQuestions: Record<string, string[]> = {
  DATA_PRIVACY: [
    '是否已获得数据主体的明确同意？',
    '数据收集是否符合最小必要原则？',
    '是否已告知数据收集目的和范围？',
    '是否存在跨境数据传输？',
    '是否已建立数据主体权利响应机制？',
  ],
  DATA_SECURITY: [
    '是否已实施数据加密措施？',
    '是否有定期安全审计机制？',
    '是否已制定数据泄露应急预案？',
    '员工是否接受过数据安全培训？',
    '是否存在访问日志审计机制？',
  ],
  CONTRACT_COMPLIANCE: [
    '合同条款是否经过法务审核？',
    '是否存在违反法律法规的条款？',
    '合同版本是否妥善管理？',
    '是否已明确数据处理责任？',
    '是否包含数据泄露通知条款？',
  ],
  REGULATORY: [
    '是否符合《个人信息保护法》要求？',
    '是否符合《网络安全法》要求？',
    '是否符合《数据安全法》要求？',
    '是否已完成必要的合规备案？',
    '是否有定期合规检查机制？',
  ],
  ACCESS_CONTROL: [
    '是否实施了最小权限原则？',
    '是否有定期权限审核机制？',
    '是否存在过度授权情况？',
    '权限变更是否有审批流程？',
    '离职人员权限是否及时撤销？',
  ],
  DATA_RETENTION: [
    '是否已制定数据留存政策？',
    '是否定期清理过期数据？',
    '数据销毁方式是否安全？',
    '是否有数据留存期限记录？',
    '是否符合监管机构的留存要求？',
  ],
};

export const checklistRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        status: z.nativeEnum(RiskStatus).optional(),
        category: z.nativeEnum(ChecklistCategory).optional(),
        department: z.nativeEnum(Department).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { limit, cursor, status, category, department } = input;

      const where: any = {};
      if (user.role === 'BUSINESS') {
        where.submitterId = user.id;
      }
      if (status) where.status = status;
      if (category) where.category = category;
      if (department) where.department = department;
      if (cursor) where.id = { gt: cursor };

      const items = await prisma.checklist.findMany({
        take: limit + 1,
        where,
        include: {
          submitter: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { risks: true, items: true },
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
      return prisma.checklist.findUnique({
        where: { id: input.id },
        include: {
          items: { orderBy: { order: 'asc' } },
          submitter: {
            select: { id: true, name: true, email: true },
          },
          risks: {
            include: {
              assignee: { select: { id: true, name: true } },
            },
          },
          contracts: true,
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        category: z.nativeEnum(ChecklistCategory),
        description: z.string().optional(),
        department: z.nativeEnum(Department),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const questions = checklistQuestions[input.category] || [];

      return prisma.checklist.create({
        data: {
          title: input.title,
          category: input.category,
          description: input.description,
          department: input.department,
          submitterId: user.id,
          items: {
            create: questions.map((q, idx) => ({
              question: q,
              order: idx,
            })),
          },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.checklist.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
        },
      });
    }),

  updateItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        answer: z.string().optional(),
        notes: z.string().optional(),
        isFlagged: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.checklistItem.update({
        where: { id: input.itemId },
        data: {
          answer: input.answer,
          notes: input.notes,
          isFlagged: input.isFlagged,
        },
      });
    }),

  submit: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.checklist.update({
        where: { id: input.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
    }),

  review: legalProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['UNDER_REVIEW', 'RECTIFICATION', 'CLOSED']),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.checklist.update({
        where: { id: input.id },
        data: {
          status: input.status,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.checklist.delete({
        where: { id: input.id },
      });
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    const where: any = {};
    if (user.role === 'BUSINESS') {
      where.submitterId = user.id;
    }

    const [total, drafts, submitted, underReview, rectification, closed] =
      await Promise.all([
        prisma.checklist.count({ where }),
        prisma.checklist.count({ where: { ...where, status: 'DRAFT' } }),
        prisma.checklist.count({ where: { ...where, status: 'SUBMITTED' } }),
        prisma.checklist.count({ where: { ...where, status: 'UNDER_REVIEW' } }),
        prisma.checklist.count({ where: { ...where, status: 'RECTIFICATION' } }),
        prisma.checklist.count({ where: { ...where, status: 'CLOSED' } }),
      ]);

    return { total, drafts, submitted, underReview, rectification, closed };
  }),
});
