import { createTRPCRouter } from "../trpc";
import { feedbackRouter } from "./feedback";
import { todoRouter } from "./todo";
import { knowledgeRouter } from "./knowledge";
import { auditLogRouter } from "./auditLog";
import { improvementRouter } from "./improvement";
import { statsRouter } from "./stats";

export const appRouter = createTRPCRouter({
  feedback: feedbackRouter,
  todo: todoRouter,
  knowledge: knowledgeRouter,
  auditLog: auditLogRouter,
  improvement: improvementRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
