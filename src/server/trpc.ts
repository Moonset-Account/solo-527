import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { prisma } from './db';
import { auth } from '@clerk/nextjs/server';
import type { UserRole } from '@prisma/client';

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId } = await auth();
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
  }
  return {
    prisma,
    user,
    clerkUserId: userId,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.clerkUserId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      user: ctx.user,
      clerkUserId: ctx.clerkUserId,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const requireRole = (roles: UserRole[]) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user || !roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '权限不足' });
    }
    return next({ ctx });
  });
