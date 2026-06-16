import { z } from 'zod';
import { protectedProcedure, adminProcedure, router } from '../trpc';
import { prisma } from '@/lib/prisma';
import { Role, Department } from '@prisma/client';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
        role: z.nativeEnum(Role).optional(),
        department: z.nativeEnum(Department).optional(),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, role, department } = input;

      const where: any = {};
      if (role) where.role = role;
      if (department) where.department = department;
      if (cursor) where.id = { gt: cursor };

      const items = await prisma.user.findMany({
        take: limit + 1,
        where,
        include: {
          _count: {
            select: {
              checklists: true,
              submittedRisks: true,
              assignedRisks: true,
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

  updateRole: adminProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.nativeEnum(Role),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.user.update({
        where: { id: input.id },
        data: { role: input.role },
      });
    }),

  updateDepartment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        department: z.nativeEnum(Department),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id !== input.id && ctx.user.role !== 'ADMIN') {
        throw new Error('无权修改其他用户信息');
      }
      return prisma.user.update({
        where: { id: input.id },
        data: { department: input.department },
      });
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.user.update({
        where: { id: ctx.user.id },
        data: { name: input.name },
      });
    }),

  getLegalUsers: protectedProcedure.query(async () => {
    return prisma.user.findMany({
      where: {
        role: { in: ['LEGAL', 'ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
  }),

  getProBonoLawyers: protectedProcedure.query(async () => {
    return prisma.user.findMany({
      where: {
        role: { in: ['PRO_BONO_LAWYER', 'ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
  }),
});
