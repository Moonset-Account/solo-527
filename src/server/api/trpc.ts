import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/server/db";
import { env } from "@/env";

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

const isClerkConfigured = (): boolean => {
  const secretKey = env.CLERK_SECRET_KEY;
  const publishableKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(
    secretKey &&
      !secretKey.startsWith("sk_test_xxx") &&
      !secretKey.includes("xxx") &&
      publishableKey &&
      !publishableKey.startsWith("pk_test_xxx") &&
      !publishableKey.includes("xxx")
  );
};

const DEMO_DIRECTOR_EMAIL = "demo_director@example.com";
const DEMO_DIRECTOR_CLERK_ID = "demo_director_clerk_id";

const getOrCreateDemoDirector = async () => {
  let user = await db.user.findUnique({
    where: { email: DEMO_DIRECTOR_EMAIL },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        clerkId: DEMO_DIRECTOR_CLERK_ID,
        email: DEMO_DIRECTOR_EMAIL,
        name: "演示总监",
        role: "SALES_DIRECTOR",
      },
    });
  }

  return user;
};

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId: clerkUserId } = auth();

  let userId: string | null = null;
  let role: UserRole = "OPERATIONS";
  let user: any = null;

  const clerkConfigured = isClerkConfigured();

  if (clerkUserId && clerkConfigured) {
    user = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (user) {
      role = mapPrismaRole(user.role);
      userId = user.id;
    } else {
      user = await db.user.create({
        data: {
          clerkId: clerkUserId,
          email: `${clerkUserId}@example.com`,
          role: "DATA_OPERATOR",
        },
      });
      role = mapPrismaRole(user.role);
      userId = user.id;
    }
  } else if (!clerkConfigured) {
    user = await getOrCreateDemoDirector();
    role = mapPrismaRole(user.role);
    userId = user.id;
  }

  return {
    db,
    userId,
    role,
    user,
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
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      role: ctx.role,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const createRoleMiddleware = (minRole: UserRole) => {
  return t.middleware(({ ctx, next }) => {
    if (ROLE_HIERARCHY[ctx.role] < ROLE_HIERARCHY[minRole]) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        ...ctx,
      },
    });
  });
};

export const directorProcedure = protectedProcedure.use(createRoleMiddleware("DIRECTOR"));
export const managerProcedure = protectedProcedure.use(createRoleMiddleware("MANAGER"));
export const operationsProcedure = protectedProcedure.use(createRoleMiddleware("OPERATIONS"));
