import { Router } from 'express';
import * as settlementController from '../controllers/settlement.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get(
  '/renewal-list',
  authMiddleware,
  roleMiddleware('OP_ADMIN', 'FIN_ADMIN', 'SYS_ADMIN'),
  settlementController.getRenewalList
);
router.get(
  '/department-summary',
  authMiddleware,
  roleMiddleware('FIN_ADMIN', 'SYS_ADMIN'),
  settlementController.getDepartmentSummary
);

export default router;
