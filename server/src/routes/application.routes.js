import { Router } from 'express';
import * as applicationController from '../controllers/application.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware('USER', 'OP_ADMIN', 'SYS_ADMIN'),
  applicationController.createValidators,
  applicationController.createApplication
);
router.get('/', authMiddleware, applicationController.getApplicationList);
router.get('/:id', authMiddleware, applicationController.getApplicationDetail);
router.put(
  '/:id/status',
  authMiddleware,
  roleMiddleware('OP_ADMIN', 'SYS_ADMIN'),
  applicationController.updateApplicationStatus
);

export default router;
