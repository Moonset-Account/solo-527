import { appRouter } from "@/server/api/root";
import { createCallerFactory, createTRPCContext } from "@/server/api/trpc";

export const createCaller = createCallerFactory(appRouter);

export const createCallerAsync = async () => {
  const ctx = await createTRPCContext({ headers: new Headers() });
  return createCaller(ctx);
};

export const api = createCallerAsync;
