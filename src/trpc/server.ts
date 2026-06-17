import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers/_app";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/server/trpc";

const createCaller = createCallerFactory(appRouter);

type ServerCallerContext = {
  prisma: typeof prisma;
  auth: AuthUser;
  req: Request;
};

export function createServerCaller(ctx: ServerCallerContext) {
  return createCaller(ctx);
}

export { createCaller };
