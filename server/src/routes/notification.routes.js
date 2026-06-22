import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();

router.get(
  '/',
  authMiddleware,
  notificationController.getNotificationList
);

router.get(
  '/:id',
  authMiddleware,
  notificationController.getNotificationDetail
);

router.post(
  '/:licenseId/remind',
  authMiddleware,
  roleMiddleware('OP_ADMIN', 'FIN_ADMIN', 'SYS_ADMIN'),
  notificationController.sendReminderValidators,
  notificationController.sendRenewalReminder
);

export default router;
