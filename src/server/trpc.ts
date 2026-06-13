import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";
import type { UserRole, User } from "@prisma/client";

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true";
const MOCK_CLERK_ID = "mock-admin-user";
const MOCK_EMAIL = "admin@dental-clinic.dev";
const MOCK_NAME = "系统管理员";

// Mock 管理员用户（当数据库不可用时返回）
const FALLBACK_MOCK_USER: Omit<User, "createdAt" | "updatedAt"> & { createdAt: Date; updatedAt: Date } = {
  id: "mock-admin-user-id",
  clerkId: MOCK_CLERK_ID,
  email: MOCK_EMAIL,
  name: MOCK_NAME,
  role: "ADMIN",
  phone: null,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

let dbUnavailable = false;
let dbUnavailableLogged = false;

async function safeFindMockUser(): Promise<User | null> {
  // 如果已经标记数据库不可用，直接返回 mock
  if (dbUnavailable) return FALLBACK_MOCK_USER as User;

  try {
    // 尝试查询数据库（先测试连接）
    const u = await prisma.user.findUnique({ where: { clerkId: MOCK_CLERK_ID } });
    if (u) return u;

    // Mock 模式下创建管理员
    const created = await prisma.user.upsert({
      where: { clerkId: MOCK_CLERK_ID },
      create: {
        clerkId: MOCK_CLERK_ID,
        email: MOCK_EMAIL,
        name: MOCK_NAME,
        role: "ADMIN",
        phone: null,
        avatarUrl: null,
      },
      update: {},
    });
    return created;
  } catch (e) {
    // 数据库不可用
    dbUnavailable = true;
    if (!dbUnavailableLogged) {
      dbUnavailableLogged = true;
      // 只记录一次警告
      console.warn(
        "\n[警告] 数据库不可用，已切换为 Mock 数据模式。" +
          "\n  页面将显示空数据，但不会崩溃。" +
          "\n  如需真实数据，请配置 DATABASE_URL 并启动 PostgreSQL。\n"
      );
    }
    return FALLBACK_MOCK_USER as User;
  }
}

export const createTRPCContext = async (opts: { headers: Headers }) => {
  let userId: string | null = null;
  if (USE_MOCK_AUTH) {
    userId = MOCK_CLERK_ID;
  } else {
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      userId = null;
    }
  }

  let dbUser: User | null = null;
  if (userId) {
    if (USE_MOCK_AUTH) {
      dbUser = await safeFindMockUser();
    } else {
      try {
        dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
        });
      } catch {
        dbUser = null;
      }
    }
  }

  return {
    db: prisma,
    userId,
    dbUser,
    dbUnavailable,
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

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.dbUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "用户未初始化" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      dbUser: ctx.dbUser,
      dbUnavailable: ctx.dbUnavailable,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const requireRole = (...roles: UserRole[]) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.dbUser) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!roles.includes(ctx.dbUser.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "权限不足" });
    }
    return next();
  });

export const managerProcedure = protectedProcedure.use(
  requireRole("MANAGER", "ADMIN")
);
export const adminProcedure = protectedProcedure.use(requireRole("ADMIN"));
