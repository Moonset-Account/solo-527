import { appRouter } from "@/server/api/root";
import { createCallerFactory } from "@/server/api/trpc";
import { prisma } from "@/server/db/prisma";
import { auth } from "@clerk/nextjs/server";

const createCaller = createCallerFactory(appRouter);

export async function createServerCaller() {
  const { userId } = await auth();
  
  return createCaller({ userId });
}
