import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "@/lib/prisma";

export type UserRole = "OPERATIONS_MANAGER" | "FOLLOW_UP_STAFF" | "DOCTOR";

export interface AuthUser {
  userId: string | null;
  role: UserRole | null;
  orgRole: string | null;
}

export function mapClerkRole(orgRole: string | undefined | null): UserRole | null {
  if (orgRole === "org:admin") return "OPERATIONS_MANAGER";
  if (orgRole === "org:doctor") return "DOCTOR";
  if (orgRole === "org:member") return "FOLLOW_UP_STAFF";
  return null;
}

export const createTRPCContext = async (opts: {
  req: Request;
  res?: Response;
  auth?: AuthUser | null;
}) => {
  const auth: AuthUser = opts.auth ?? {
    userId: null,
    role: null,
    orgRole: null,
  };

  return { prisma, auth, req: opts.req };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const { createCallerFactory } = t;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "未登录" });
  }
  return next();
});

export const operationsManagerProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "未登录" });
  }
  if (ctx.auth.role !== "OPERATIONS_MANAGER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "需要运营负责人权限",
    });
  }
  return next();
});

export const doctorOrManagerProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "未登录" });
  }
  if (!["OPERATIONS_MANAGER", "DOCTOR"].includes(ctx.auth.role ?? "")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "需要医师或运营负责人权限",
    });
  }
  return next();
});
