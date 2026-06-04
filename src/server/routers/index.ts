import { router } from '../trpc';
import { bookingRouter } from './booking.router';
import { deviceRouter } from './device.router';
import { userRouter } from './user.router';
import { projectRouter } from './project.router';
import { maintenanceRouter } from './maintenance.router';
import { reportRouter } from './report.router';
import { notificationRouter } from './notification.router';

export const appRouter = router({
  booking: bookingRouter,
  device: deviceRouter,
  user: userRouter,
  project: projectRouter,
  maintenance: maintenanceRouter,
  report: reportRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
