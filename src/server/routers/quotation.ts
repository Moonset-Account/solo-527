import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, requireRole } from '../trpc';
import { QuotationStatus, ExtraItemStatus, UserRole } from '@prisma/client';
import { calculateBudgetAlert } from '~/lib/utils';

export const quotationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(QuotationStatus).optional(),
        extraItemStatus: z.nativeEnum(ExtraItemStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const [quotations, extraItems] = await Promise.all([
        ctx.prisma.quotation.findMany({
          where: { status: input.status },
          include: { project: { select: { id: true, name: true, code: true } }, confirmedBy: true },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.extraItem.findMany({
          where: { status: input.extraItemStatus },
          include: { project: { select: { id: true, name: true, code: true } }, confirmedBy: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      return { quotations, extraItems };
    }),

  confirmQuotation: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.DESIGNER, UserRole.PROJECT_MANAGER]))
    .input(
      z.object({
        id: z.string(),
        confirmed: z.boolean(),
        rejectReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quotation = await ctx.prisma.quotation.update({
        where: { id: input.id },
        data: {
          status: input.confirmed ? QuotationStatus.CONFIRMED : QuotationStatus.REJECTED,
          confirmedAt: input.confirmed ? new Date() : null,
          confirmedById: input.confirmed ? ctx.user?.id : null,
          rejectedReason: input.confirmed ? undefined : input.rejectReason,
        },
        include: { project: true },
      });

      if (input.confirmed) {
        const project = quotation.project;
        const actualCost = project.actualCost.toNumber();
        const totalBudget = quotation.amount.toNumber();
        const usedPercent = totalBudget > 0 ? (actualCost / totalBudget) * 100 : 0;

        await ctx.prisma.project.update({
          where: { id: project.id },
          data: {
            totalBudget: quotation.amount,
            status: 'QUOTATION_CONFIRMED',
            budgetUsedPercent: usedPercent,
            budgetAlertLevel: calculateBudgetAlert(usedPercent),
          },
        });

        await ctx.prisma.changeHistory.create({
          data: {
            projectId: project.id,
            entityType: 'Quotation',
            entityId: quotation.id,
            fieldName: 'status',
            oldValue: 'PENDING_CONFIRM',
            newValue: 'CONFIRMED',
            changeType: 'UPDATE',
            createdById: ctx.user?.id,
            responsibleId: ctx.user?.id,
            remark: '报价确认',
          },
        });
      }

      return quotation;
    }),

  createQuotation: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER]))
    .input(
      z.object({
        projectId: z.string(),
        amount: z.number(),
        items: z.array(z.any()).default([]),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lastQuotation = await ctx.prisma.quotation.findFirst({
        where: { projectId: input.projectId },
        orderBy: { version: 'desc' },
      });

      const quotation = await ctx.prisma.quotation.create({
        data: {
          projectId: input.projectId,
          amount: input.amount,
          items: input.items,
          remark: input.remark,
          version: (lastQuotation?.version ?? 0) + 1,
          status: QuotationStatus.PENDING_CONFIRM,
        },
      });

      await ctx.prisma.project.update({
        where: { id: input.projectId },
        data: { status: 'QUOTATION_PENDING' },
      });

      await ctx.prisma.changeHistory.create({
        data: {
          projectId: input.projectId,
          entityType: 'Quotation',
          entityId: quotation.id,
          fieldName: 'created',
          oldValue: null,
          newValue: `报价单 v${quotation.version} 创建`,
          changeType: 'CREATE',
          createdById: ctx.user?.id,
          responsibleId: ctx.user?.id,
        },
      });

      return quotation;
    }),

  confirmExtraItem: protectedProcedure
    .use(requireRole([UserRole.ADMIN, UserRole.DESIGNER, UserRole.PROJECT_MANAGER]))
    .input(
      z.object({
        id: z.string(),
        confirmed: z.boolean(),
        rejectReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const extraItem = await ctx.prisma.extraItem.update({
        where: { id: input.id },
        data: {
          status: input.confirmed ? ExtraItemStatus.CONFIRMED : ExtraItemStatus.REJECTED,
          confirmedAt: input.confirmed ? new Date() : null,
          confirmedById: input.confirmed ? ctx.user?.id : null,
          rejectedReason: input.confirmed ? undefined : input.rejectReason,
        },
        include: { project: true },
      });

      if (input.confirmed) {
        const project = extraItem.project;
        const newTotalBudget = project.totalBudget.toNumber() + extraItem.amount.toNumber();
        const actualCost = project.actualCost.toNumber() + extraItem.amount.toNumber();
        const usedPercent = newTotalBudget > 0 ? (actualCost / newTotalBudget) * 100 : project.budgetUsedPercent;
        const isAbnormal = usedPercent > 85;

        await ctx.prisma.project.update({
          where: { id: project.id },
          data: {
            totalBudget: newTotalBudget,
            actualCost,
            budgetUsedPercent: usedPercent,
            budgetAlertLevel: calculateBudgetAlert(usedPercent),
          },
        });

        await ctx.prisma.budgetChange.create({
          data: {
            projectId: project.id,
            oldBudget: project.totalBudget,
            newBudget: newTotalBudget,
            changeAmount: extraItem.amount,
            changePercent: ((newTotalBudget - project.totalBudget.toNumber()) / project.totalBudget.toNumber()) * 100,
            reason: `增项确认: ${extraItem.name}`,
            isAbnormal,
            alertLevel: calculateBudgetAlert(usedPercent),
            responsibleId: ctx.user?.id,
            createdById: ctx.user?.id,
          },
        });

        await ctx.prisma.changeHistory.create({
          data: {
            projectId: project.id,
            entityType: 'ExtraItem',
            entityId: extraItem.id,
            fieldName: 'status',
            oldValue: 'PENDING_CONFIRM',
            newValue: 'CONFIRMED',
            changeType: 'UPDATE',
            createdById: ctx.user?.id,
            responsibleId: ctx.user?.id,
            remark: `增项确认: ${extraItem.name}`,
          },
        });
      }

      return extraItem;
    }),

  createExtraItem: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        description: z.string(),
        amount: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const extraItem = await ctx.prisma.extraItem.create({
        data: {
          ...input,
          status: ExtraItemStatus.PENDING_CONFIRM,
        },
      });

      await ctx.prisma.changeHistory.create({
        data: {
          projectId: input.projectId,
          entityType: 'ExtraItem',
          entityId: extraItem.id,
          fieldName: 'created',
          oldValue: null,
          newValue: `增项创建: ${input.name}`,
          changeType: 'CREATE',
          createdById: ctx.user?.id,
          responsibleId: ctx.user?.id,
        },
      });

      return extraItem;
    }),
});
