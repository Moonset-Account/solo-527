import { createTRPCRouter } from "../trpc";
import { funnelRouter } from "./funnel";
import { waitlistRouter } from "./waitlist";
import { rankingRouter } from "./ranking";
import { exportRouter } from "./export";

export const appRouter = createTRPCRouter({
  funnel: funnelRouter,
  waitlist: waitlistRouter,
  ranking: rankingRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
