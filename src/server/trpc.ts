import { initTRPC, TRPCError } from '@trpc/server';
import type { UserRole } from '@prisma/client';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { prisma } from './db';

export interface Context {
  user: {
    id: string;
    role: UserRole;
    email: string;
    name: string;
  } | null;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const requireRole = (roles: UserRole[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next({ ctx: { user: ctx.user } });
  });

export const studentProcedure = t.procedure.use(enforceUserIsAuthed).use(requireRole(['STUDENT']));
export const mentorProcedure = t.procedure.use(enforceUserIsAuthed).use(requireRole(['MENTOR', 'ADMIN']));
export const adminProcedure = t.procedure.use(enforceUserIsAuthed).use(requireRole(['ADMIN']));
export const maintenanceProcedure = t.procedure.use(enforceUserIsAuthed).use(requireRole(['MAINTENANCE', 'ADMIN']));
