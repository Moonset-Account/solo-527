import { createTRPCRouter } from "../trpc";
import { funnelRouter } from "./funnel";
import { waitlistRouter } from "./waitlist";
import { rankingRouter } from "./ranking";
import { exportRouter } from "./export";
import { metaRouter } from "./meta";

export const appRouter = createTRPCRouter({
  funnel: funnelRouter,
  waitlist: waitlistRouter,
  ranking: rankingRouter,
  export: exportRouter,
  meta: metaRouter,
});

export type AppRouter = typeof appRouter;
