import type { AppRouter } from "@/server/api/root";
import { createCallerFactory } from "@/server/api/trpc";

export const createCaller = createCallerFactory<AppRouter>();

export const api = createCaller;
