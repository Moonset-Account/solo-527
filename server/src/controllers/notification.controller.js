import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.js';
import { success, error } from '../utils/response.js';
import * as notificationService from '../services/notification.service.js';

export const sendReminderValidators = [
  body('handleResult').optional().isString(),
  validateRequest,
];

export async function getNotificationList(req, res) {
  try {
    const result = await notificationService.getNotificationList(
      req.user.id,
      req.user.role,
      req.query
    );
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function getNotificationDetail(req, res) {
  try {
    const result = await notificationService.getNotificationDetail(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function sendRenewalReminder(req, res) {
  try {
    const result = await notificationService.sendRenewalReminder(
      req.params.licenseId,
      req.user.id,
      req.body
    );
    res.json(success(result, '提醒已发送'));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}
