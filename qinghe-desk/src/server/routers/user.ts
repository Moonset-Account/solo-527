import { createTRPCRouter, publicProcedure } from "@/trpc/server";
import { prisma } from "@/lib/prisma";

export const userRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return prisma.user.findMany({ orderBy: { name: "asc" } });
  }),
});
