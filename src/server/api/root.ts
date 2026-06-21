import { createCallerFactory, router } from "@/server/api/trpc";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { leaseRouter } from "@/server/api/routers/lease";
import { billRouter } from "@/server/api/routers/bill";
import { assignmentRouter } from "@/server/api/routers/assignment";
import { settlementRouter } from "@/server/api/routers/settlement";
import { contractRouter } from "@/server/api/routers/contract";
import { auditRouter } from "@/server/api/routers/audit";
import { userRouter } from "@/server/api/routers/user";

export const appRouter = router({
  dashboard: dashboardRouter,
  lease: leaseRouter,
  bill: billRouter,
  assignment: assignmentRouter,
  settlement: settlementRouter,
  contract: contractRouter,
  audit: auditRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
