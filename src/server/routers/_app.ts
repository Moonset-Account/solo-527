import { createTRPCRouter } from "../trpc";
import { assetRouter } from "./asset.router";
import { configItemRouter } from "./config-item.router";
import { alertRouter } from "./alert.router";
import { vulnerabilityRouter } from "./vulnerability.router";
import { inspectionRouter } from "./inspection.router";
import { rollbackRouter } from "./rollback.router";
import { userRouter } from "./user.router";
import { auditRouter } from "./audit.router";

export const appRouter = createTRPCRouter({
  asset: assetRouter,
  configItem: configItemRouter,
  alert: alertRouter,
  vulnerability: vulnerabilityRouter,
  inspection: inspectionRouter,
  rollback: rollbackRouter,
  user: userRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
