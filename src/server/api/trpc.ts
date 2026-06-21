import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { clerkClient, auth } from "@clerk/nextjs/server";
import type { UserRole } from "@prisma/client";

import { db } from "@/server/db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = auth();
  let user = null;

  if (session.userId) {
    user = await db.user.findUnique({
      where: { clerkId: session.userId },
    });

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(session.userId);
      user = await db.user.create({
        data: {
          clerkId: session.userId,
          name: clerkUser.fullName || clerkUser.username || "未知用户",
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          role: UserRole.FRONTLINE,
        },
      });
    }
  }

  return {
    db,
    user,
    session,
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
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session.userId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

const hasRole = (roles: UserRole[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "权限不足" });
    }
    return next();
  });

export const financeProcedure = protectedProcedure.use(hasRole(["FINANCE", "ADMIN"]));
export const adminProcedure = protectedProcedure.use(hasRole(["ADMIN"]));
export const frontlineProcedure = protectedProcedure.use(hasRole(["FRONTLINE", "ADMIN"]));

const trackChanges = t.middleware(async ({ ctx, next, type, path }) => {
  const result = await next();

  if (ctx.user && (path.includes("update") || path.includes("complete") || path.includes("pay"))) {
    console.log(`[Change Tracking] ${ctx.user.name} performed ${path}`);
  }

  return result;
});

export const auditedProcedure = protectedProcedure.use(trackChanges);
