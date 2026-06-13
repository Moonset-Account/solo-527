import { createTRPCRouter } from "../trpc";
import { userRouter } from "./user";
import { customerRouter } from "./customer";
import { consultationRouter } from "./consultation";
import { leadRouter } from "./lead";
import { stageRouter } from "./stage";
import { tagRouter } from "./tag";
import { followUpRouter } from "./followUp";
import { paymentRouter } from "./payment";
import { abnormalRouter } from "./abnormal";
import { logRouter } from "./log";

export const appRouter = createTRPCRouter({
  user: userRouter,
  customer: customerRouter,
  consultation: consultationRouter,
  lead: leadRouter,
  stage: stageRouter,
  tag: tagRouter,
  followUp: followUpRouter,
  payment: paymentRouter,
  abnormal: abnormalRouter,
  log: logRouter,
});

export type AppRouter = typeof appRouter;
