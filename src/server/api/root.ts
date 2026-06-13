import { router } from "./trpc";
import { metricRouter } from "./routers/metric";
import { alertRuleRouter } from "./routers/alertRule";
import { anomalyRouter } from "./routers/anomaly";
import { reportRouter } from "./routers/report";
import { seedRouter } from "./routers/seed";

export const appRouter = router({
  metric: metricRouter,
  alertRule: alertRuleRouter,
  anomaly: anomalyRouter,
  report: reportRouter,
  seed: seedRouter,
});

export type AppRouter = typeof appRouter;
