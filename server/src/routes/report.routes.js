import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get(
  '/usage-trend',
  authMiddleware,
  roleMiddleware('OP_ADMIN', 'FIN_ADMIN', 'SYS_ADMIN'),
  reportController.getUsageTrend
);
router.get(
  '/seat-utilization',
  authMiddleware,
  roleMiddleware('OP_ADMIN', 'FIN_ADMIN', 'SYS_ADMIN'),
  reportController.getSeatUtilization
);

export default router;
