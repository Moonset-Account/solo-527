import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { vehicleRouter } from "@/server/api/routers/vehicle";
import { workOrderRouter } from "@/server/api/routers/workOrder";
import { partRouter } from "@/server/api/routers/part";
import { inventoryRouter } from "@/server/api/routers/inventory";
import { scheduleRouter } from "@/server/api/routers/schedule";
import { qualityRouter } from "@/server/api/routers/quality";
import { delayRouter } from "@/server/api/routers/delay";
import { statsRouter } from "@/server/api/routers/stats";
import { auditLogRouter } from "@/server/api/routers/auditLog";
import { exportRouter } from "@/server/api/routers/export";

export const appRouter = createTRPCRouter({
  vehicle: vehicleRouter,
  workOrder: workOrderRouter,
  part: partRouter,
  inventory: inventoryRouter,
  schedule: scheduleRouter,
  quality: qualityRouter,
  delay: delayRouter,
  stats: statsRouter,
  auditLog: auditLogRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
