import { createCallerFactory } from "./trpc";
import { appRouter } from "./root";
import { createTRPCContext } from "./trpc";

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(createTRPCContext);
