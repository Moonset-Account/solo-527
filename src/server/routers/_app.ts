import { createTRPCRouter } from '../trpc';
import { projectRouter } from './project';
import { quotationRouter } from './quotation';
import { inspectionRouter } from './inspection';
import { complaintRouter } from './complaint';
import { phaseRouter } from './phase';
import { userRouter } from './user';

export const appRouter = createTRPCRouter({
  project: projectRouter,
  quotation: quotationRouter,
  inspection: inspectionRouter,
  complaint: complaintRouter,
  phase: phaseRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
