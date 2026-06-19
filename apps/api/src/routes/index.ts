import { Router } from 'express';
import seatsRouter from './seats';
import usageRouter from './usage';
import remindersRouter from './reminders';
import paymentsRouter from './payments';
import logsRouter from './logs';
import exportsRouter from './exports';
import statsRouter from './stats';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/seats', seatsRouter);
router.use('/usage', usageRouter);
router.use('/reminders', remindersRouter);
router.use('/payments', paymentsRouter);
router.use('/logs', logsRouter);
router.use('/exports', exportsRouter);
router.use('/stats', statsRouter);

export default router;
