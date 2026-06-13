import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";
import type { UserRole } from "@prisma/client";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId } = await auth();

  let dbUser = null;
  if (userId) {
    dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
  }

  return {
    db: prisma,
    userId,
    dbUser,
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
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.dbUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "用户未初始化" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      dbUser: ctx.dbUser,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const requireRole = (...roles: UserRole[]) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.dbUser) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!roles.includes(ctx.dbUser.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "权限不足" });
    }
    return next();
  });

export const managerProcedure = protectedProcedure.use(
  requireRole("MANAGER", "ADMIN")
);
export const adminProcedure = protectedProcedure.use(requireRole("ADMIN"));
