import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/server/db";

export type UserRole = "DIRECTOR" | "MANAGER" | "OPERATIONS";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  OPERATIONS: 1,
  MANAGER: 2,
  DIRECTOR: 3,
};

const mapPrismaRole = (prismaRole: string): UserRole => {
  switch (prismaRole) {
    case "SALES_DIRECTOR":
      return "DIRECTOR";
    case "SALES_MANAGER":
      return "MANAGER";
    case "DATA_OPERATOR":
      return "OPERATIONS";
    default:
      return "OPERATIONS";
  }
};

const mapRoleToPrisma = (role: UserRole): string => {
  switch (role) {
    case "DIRECTOR":
      return "SALES_DIRECTOR";
    case "MANAGER":
      return "SALES_MANAGER";
    case "OPERATIONS":
      return "DATA_OPERATOR";
  }
};

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId } = auth();

  let role: UserRole = "OPERATIONS";

  if (userId) {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (user) {
      role = mapPrismaRole(user.role);
    } else {
      const created = await db.user.create({
        data: {
          clerkId: userId,
          email: `${userId}@placeholder.local`,
          role: mapRoleToPrisma("OPERATIONS") as any,
        },
      });
      role = mapPrismaRole(created.role);
    }
  } else if (process.env.NODE_ENV === "development") {
    role = "DIRECTOR";
  }

  return {
    db,
    userId,
    role,
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

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId && process.env.NODE_ENV !== "development") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      userId: ctx.userId ?? "dev-mock-user",
      role: ctx.role,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceIsDirector = t.middleware(({ ctx, next }) => {
  if (ctx.role !== "DIRECTOR") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
    },
  });
});

const enforceIsAtLeastManager = t.middleware(({ ctx, next }) => {
  if (ROLE_HIERARCHY[ctx.role] < ROLE_HIERARCHY.MANAGER) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
    },
  });
});

export const directorProcedure = protectedProcedure.use(enforceIsDirector);
export const managerProcedure = protectedProcedure.use(enforceIsAtLeastManager);
