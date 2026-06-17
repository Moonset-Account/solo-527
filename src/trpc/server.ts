import { createCallerFactory } from "@trpc/server";
import { appRouter } from "@/server/routers/_app";
import { prisma } from "@/lib/prisma";

type UserRole = "OPERATIONS_MANAGER" | "FOLLOW_UP_STAFF" | "DOCTOR";

interface AuthUser {
  userId: string | null;
  role: UserRole | null;
  orgRole: string | null;
}

const createCaller = createCallerFactory(appRouter);

export function createServerCaller() {
  const auth: AuthUser = {
    userId: "dev-admin",
    role: "OPERATIONS_MANAGER",
    orgRole: null,
  };
  return createCaller({
    prisma,
    auth,
    req: new Request("http://localhost"),
  });
}

export { createCaller };
