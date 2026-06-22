import { Router } from 'express';
import * as pricingController from '../controllers/pricing.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/plans', authMiddleware, pricingController.getPlanList);
router.post(
  '/plans',
  authMiddleware,
  roleMiddleware('OP_ADMIN', 'SYS_ADMIN'),
  pricingController.createPlanValidators,
  pricingController.createPlan
);
router.put(
  '/plans/:id',
  authMiddleware,
  roleMiddleware('OP_ADMIN', 'SYS_ADMIN'),
  pricingController.updatePlan
);

export default router;
