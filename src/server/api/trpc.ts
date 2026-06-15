import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

export const createTRPCContext = async () => {
  const { userId } = auth();
  const user = await currentUser();

  let dbUser = null;
  if (userId) {
    dbUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: user?.emailAddresses[0]?.emailAddress,
        name: user?.fullName,
      },
      create: {
        id: userId,
        email: user?.emailAddresses[0]?.emailAddress || "",
        name: user?.fullName,
        role: UserRole.STUDENT,
      },
    });
  }

  return {
    prisma,
    userId,
    user: dbUser,
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
export const createCallerFactory = t.createCallerFactory;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.user.role !== UserRole.ADMIN && ctx.user.role !== UserRole.DORM_MANAGER) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      user: ctx.user,
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

const enforceUserIsSuperAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.user.role !== UserRole.ADMIN) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      user: ctx.user,
    },
  });
});

export const superAdminProcedure = t.procedure.use(enforceUserIsSuperAdmin);
