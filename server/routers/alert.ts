import { z } from 'zod';
import { protectedProcedure, proBonoProcedure, legalProcedure, router } from '../trpc';
import { prisma } from '@/lib/prisma';
import { AlertType, AlertStatus } from '@prisma/client';

export const alertRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        status: z.nativeEnum(AlertStatus).optional(),
        type: z.nativeEnum(AlertType).optional(),
        assigneeId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { limit, cursor, status, type, assigneeId } = input;

      const where: any = {};
      if (user.role === 'PRO_BONO_LAWYER') {
        where.assigneeId = user.id;
      }
      if (user.role === 'BUSINESS') {
        where.reporterId = user.id;
      }
      if (status) where.status = status;
      if (type) where.type = type;
      if (assigneeId) where.assigneeId = assigneeId;
      if (cursor) where.id = { gt: cursor };

      const items = await prisma.alert.findMany({
        take: limit + 1,
        where,
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          risk: { select: { id: true, title: true, riskLevel: true } },
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
      return prisma.alert.findUnique({
        where: { id: input.id },
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          risk: {
            select: {
              id: true,
              title: true,
              riskLevel: true,
              status: true,
              description: true,
            },
          },
        },
      });
    }),

  create: legalProcedure
    .input(
      z.object({
        type: z.nativeEnum(AlertType),
        title: z.string().min(1),
        description: z.string().min(1),
        riskId: z.string().optional(),
        assigneeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return prisma.$transaction(async (tx) => {
        const alert = await tx.alert.create({
          data: {
            type: input.type,
            title: input.title,
            description: input.description,
            reporterId: user.id,
            riskId: input.riskId,
            assigneeId: input.assigneeId,
          },
        });

        if (input.riskId) {
          await tx.risk.update({
            where: { id: input.riskId },
            data: { status: 'ESCALATED' },
          });
        }

        return alert;
      });
    }),

  updateStatus: proBonoProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(AlertStatus),
        resolution: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return prisma.$transaction(async (tx) => {
        const data: any = {
          status: input.status,
        };

        if (input.status === 'RESOLVED' || input.status === 'CLOSED') {
          data.resolvedAt = new Date();
          data.closedBy = user.id;
        }

        if (input.resolution) {
          data.resolution = input.resolution;
        }

        const alert = await tx.alert.update({
          where: { id: input.id },
          data,
        });

        if (input.status === 'CLOSED' && alert.riskId) {
          await tx.risk.update({
            where: { id: alert.riskId },
            data: { status: 'CLOSED', closedAt: new Date() },
          });
        }

        return alert;
      });
    }),

  assign: legalProcedure
    .input(
      z.object({
        id: z.string(),
        assigneeId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.alert.update({
        where: { id: input.id },
        data: { assigneeId: input.assigneeId },
      });
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    const where: any = {};
    if (user.role === 'PRO_BONO_LAWYER') {
      where.assigneeId = user.id;
    }
    if (user.role === 'BUSINESS') {
      where.reporterId = user.id;
    }

    const [total, open, acknowledged, investigating, resolved, closed] =
      await Promise.all([
        prisma.alert.count({ where }),
        prisma.alert.count({ where: { ...where, status: 'OPEN' } }),
        prisma.alert.count({ where: { ...where, status: 'ACKNOWLEDGED' } }),
        prisma.alert.count({ where: { ...where, status: 'INVESTIGATING' } }),
        prisma.alert.count({ where: { ...where, status: 'RESOLVED' } }),
        prisma.alert.count({ where: { ...where, status: 'CLOSED' } }),
      ]);

    const permissionEscalation = await prisma.alert.count({
      where: { ...where, type: 'PERMISSION_ESCALATION' },
    });

    return {
      total,
      open,
      acknowledged,
      investigating,
      resolved,
      closed,
      permissionEscalation,
    };
  }),
});
