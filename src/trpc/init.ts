import { initTRPC } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getAuth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export function createContext({ req }: { req: NextRequest } & FetchCreateContextFnOptions) {
  const { userId } = getAuth(req);
  return { userId };
}

const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new Error("UNAUTHORIZED");
  }
  return next({ ctx: { userId: ctx.userId } });
});
