import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { UserRole } from "@/types";
import { LRUCache } from "lru-cache";
import { hashObject } from "../utils";

export interface Context {
  user: {
    id: string;
    role: UserRole;
    teamIds?: string[];
  } | null;
}

const t = initTRPC.context<Context>().create({
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

const cache = new LRUCache<string, { data: unknown; timestamp: number }>({
  max: 500,
  ttl: 5 * 60 * 1000,
});

const authMiddleware = t.middleware(({ next, ctx }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

const cacheMiddleware = t.middleware(async ({ next, path, input, ctx }) => {
  const userKey = ctx.user ? `${ctx.user.id}:${ctx.user.role}` : "public";
  const cacheKey = `${userKey}:${path}:${hashObject(input as object)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return next();
  }

  const result = await next();

  if (result.ok) {
    cache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now(),
    });
  }

  return result;
});

const roleMiddleware = (allowedRoles: UserRole[]) =>
  t.middleware(({ next, ctx }) => {
    if (!ctx.user || !allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  });

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);
export const supervisorProcedure = protectedProcedure.use(roleMiddleware(["supervisor", "admin"]));
export const adminProcedure = protectedProcedure.use(roleMiddleware(["admin"]));
