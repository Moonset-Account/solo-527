import { createCallerFactory } from "@trpc/server";
import { appRouter } from "@/server/routers/_app";

const createCaller = createCallerFactory(appRouter);

export { createCaller };
