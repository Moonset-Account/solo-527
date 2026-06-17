import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "@/lib/prisma";

export const createTRPCContext = async (opts: {
  req: Request;
  res?: Response;
}) => {
  return { prisma };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure;
