import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "@/lib/prisma";

export type UserRole = "OPERATIONS_MANAGER" | "FOLLOW_UP_STAFF" | "DOCTOR";

export interface AuthUser {
  userId: string | null;
  role: UserRole | null;
  orgRole: string | null;
}

export const createTRPCContext = async (opts: {
  req: Request;
  res?: Response;
}) => {
  const auth: AuthUser = { userId: null, role: null, orgRole: null };

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk = !!publishableKey && !publishableKey.includes("placeholder");

  const clerkUserId = opts.req.headers.get("x-clerk-user-id") ?? null;
  const clerkRole = opts.req.headers.get("x-clerk-role") ?? null;
  const clerkOrgRole = opts.req.headers.get("x-clerk-org-role") ?? null;

  if (hasClerk) {
    if (clerkUserId) {
      auth.userId = clerkUserId;
    }
    if (clerkOrgRole) {
      auth.orgRole = clerkOrgRole;
    }
    if (clerkRole === "admin" || clerkOrgRole === "org:admin") {
      auth.role = "OPERATIONS_MANAGER";
    } else if (clerkOrgRole === "org:doctor") {
      auth.role = "DOCTOR";
    } else if (clerkRole === "basic_member" || clerkOrgRole === "org:member") {
      auth.role = "FOLLOW_UP_STAFF";
    } else if (auth.userId) {
      auth.role = auth.role ?? "FOLLOW_UP_STAFF";
    }
  }

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
