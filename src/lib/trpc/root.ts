import { router } from "./server";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = router({
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
