import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, requireRole } from '../trpc';
import { UserRole } from '@prisma/client';

export const userRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      include: {
        decorationCompany: true,
      },
      orderBy: { name: 'asc' },
    });
  }),

  listByRole: protectedProcedure
    .input(z.object({ role: z.nativeEnum(UserRole) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findMany({
        where: { role: input.role },
        orderBy: { name: 'asc' },
      });
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  syncOrCreate: protectedProcedure
    .input(
      z.object({
        email: z.string(),
        name: z.string().optional(),
        role: z.nativeEnum(UserRole).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.clerkUserId) throw new Error('未登录');

      return ctx.prisma.user.upsert({
        where: { clerkId: ctx.clerkUserId },
        update: {
          email: input.email,
          name: input.name,
        },
        create: {
          clerkId: ctx.clerkUserId,
          email: input.email,
          name: input.name,
          role: input.role ?? UserRole.DESIGNER,
        },
      });
    }),

  updateRole: protectedProcedure
    .use(requireRole([UserRole.ADMIN]))
    .input(
      z.object({
        id: z.string(),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.id },
        data: { role: input.role },
      });
    }),

  listDecorationCompanies: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.decorationCompany.findMany({
      include: {
        projects: { select: { id: true, name: true, code: true } },
        users: true,
      },
      orderBy: { name: 'asc' },
    });
  }),
});
