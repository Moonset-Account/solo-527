import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { getCurrentUser } from '@/lib/auth';

const t = initTRPC.create({
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

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(async ({ next }) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

const isLegal = t.middleware(async ({ ctx, next }) => {
  const user = ctx.user;
  if (user.role !== 'LEGAL' && user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要法务或管理员权限' });
  }
  return next();
});

export const legalProcedure = protectedProcedure.use(isLegal);

const isAdmin = t.middleware(async ({ ctx, next }) => {
  const user = ctx.user;
  if (user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员权限' });
  }
  return next();
});

export const adminProcedure = protectedProcedure.use(isAdmin);

const isProBonoLawyer = t.middleware(async ({ ctx, next }) => {
  const user = ctx.user;
  if (user.role !== 'PRO_BONO_LAWYER' && user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要公益律师或管理员权限' });
  }
  return next();
});

export const proBonoProcedure = protectedProcedure.use(isProBonoLawyer);

export const createCallerFactory = t.createCallerFactory;
