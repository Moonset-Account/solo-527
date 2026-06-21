import { router, createCallerFactory } from "../trpc";
import { dashboardRouter } from "./dashboard";
import { leadsRouter } from "./leads";
import { trialsRouter } from "./trials";
import { classesRouter } from "./classes";
import { worksRouter } from "./works";
import { consumptionsRouter } from "./consumptions";
import { feedbackRouter } from "./feedback";
import { auditRouter } from "./audit";
import { reportsRouter } from "./reports";
import { settingsRouter } from "./settings";

export const appRouter = router({
  dashboard: dashboardRouter,
  leads: leadsRouter,
  trials: trialsRouter,
  classes: classesRouter,
  works: worksRouter,
  consumptions: consumptionsRouter,
  feedback: feedbackRouter,
  audit: auditRouter,
  reports: reportsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
