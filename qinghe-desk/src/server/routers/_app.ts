import { createTRPCRouter } from "@/trpc/server";
import { tenantRouter } from "./tenant";
import { roomRouter } from "./room";
import { serviceRouter } from "./service";
import { billRouter } from "./bill";
import { repairRouter } from "./repair";
import { inspectionRouter } from "./inspection";
import { auditLogRouter } from "./auditLog";
import { dashboardRouter } from "./dashboard";

export const appRouter = createTRPCRouter({
  tenant: tenantRouter,
  room: roomRouter,
  service: serviceRouter,
  bill: billRouter,
  repair: repairRouter,
  inspection: inspectionRouter,
  auditLog: auditLogRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
