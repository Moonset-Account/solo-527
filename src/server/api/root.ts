import { createTRPCRouter } from "./trpc";
import { repairRouter } from "./routers/repair";
import { complaintRouter } from "./routers/complaint";
import { refundRouter } from "./routers/refund";
import { tradeRouter } from "./routers/trade";
import { exportRouter } from "./routers/export";
import { notificationRouter } from "./routers/notification";
import { auditLogRouter } from "./routers/audit-log";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
  repair: repairRouter,
  complaint: complaintRouter,
  refund: refundRouter,
  trade: tradeRouter,
  export: exportRouter,
  notification: notificationRouter,
  auditLog: auditLogRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
