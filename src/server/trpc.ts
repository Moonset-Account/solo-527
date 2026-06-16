import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export const createTRPCContext = async () => {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;

  let dbUser = null;
  if (user) {
    dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress ?? "",
          name: user.fullName ?? user.username ?? "Unknown",
          role:
            (user.publicMetadata?.role as string) ?? "CUSTOMER",
        },
      });
    }
  }

  return {
    prisma,
    userId: user?.id ?? null,
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

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      user: ctx.user,
    },
  });
});

export const supervisorProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user.role !== "SUPERVISOR") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "仅客服主管可执行此操作",
      });
    }
    return next({ ctx });
  }
);

export const staffProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (ctx.user.role !== "STAFF" && ctx.user.role !== "SUPERVISOR") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "仅客服人员或主管可执行此操作",
      });
    }
    return next({ ctx });
  }
);
