import { initTRPC, TRPCError } from "@trpc/server";
import { SuperJSON } from "superjson";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const t = initTRPC.create({
  transformer: SuperJSON,
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

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "未登录" });
  }
  return next({ ctx: { ...ctx, user } });
});

export function requireRoles(...roles: UserRole[]) {
  return t.procedure.use(async ({ ctx, next }) => {
    const user = await getCurrentUser();
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "未登录" });
    }
    if (!roles.includes(user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "权限不足" });
    }
    return next({ ctx: { ...ctx, user } });
  });
}

export const adminProcedure = requireRoles(UserRole.ADMIN);
export const itManagerProcedure = requireRoles(UserRole.ADMIN, UserRole.IT_MANAGER);
