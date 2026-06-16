import { router } from '../trpc';
import { checklistRouter } from './checklist';
import { riskRouter } from './risk';
import { userRouter } from './user';
import { contractRouter } from './contract';
import { alertRouter } from './alert';

export const appRouter = router({
  checklist: checklistRouter,
  risk: riskRouter,
  user: userRouter,
  contract: contractRouter,
  alert: alertRouter,
});

export type AppRouter = typeof appRouter;
