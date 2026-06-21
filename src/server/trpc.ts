import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Staff, Role } from "@/types";

export interface TRPCContext {
  staff?: Staff;
  campusId?: string;
  headers: Headers;
}

const t = initTRPC.context<TRPCContext>().create({
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

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.staff) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "未登录或账号未关联员工" });
  }
  return next({ ctx: { staff: ctx.staff, campusId: ctx.campusId! } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

export const requireRoles = (...roles: Role[]) =>
  t.middleware(({ next, ctx }) => {
    if (!ctx.staff) throw new TRPCError({ code: "UNAUTHORIZED" });
    if (!roles.includes(ctx.staff.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: `需要角色: ${roles.join(",")}` });
    }
    return next({ ctx: { staff: ctx.staff, campusId: ctx.campusId! } });
  });

export const createCallerFactory = t.createCallerFactory;
