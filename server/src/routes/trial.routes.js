import { Router } from 'express';
import * as trialController from '../controllers/trial.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get(
  '/',
  authMiddleware,
  roleMiddleware('OP_ADMIN', 'SYS_ADMIN'),
  trialController.getTrialList
);
router.put(
  '/:id/handle',
  authMiddleware,
  roleMiddleware('OP_ADMIN', 'SYS_ADMIN'),
  trialController.handleValidators,
  trialController.handleTrial
);

export default router;
