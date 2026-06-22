import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.js';
import { success, error } from '../utils/response.js';
import * as applicationService from '../services/application.service.js';

export const createValidators = [
  body('pluginId').isInt().withMessage('插件ID不能为空'),
  body('planId').isInt().withMessage('套餐ID不能为空'),
  body('reason').notEmpty().withMessage('申请理由不能为空'),
  body('seatCount').optional().isInt({ min: 1 }).withMessage('席位数量必须大于0'),
  body('trialDays').optional().isInt({ min: 0, max: 30 }).withMessage('试用天数需在0-30之间'),
  validateRequest,
];

export async function createApplication(req, res) {
  try {
    const result = await applicationService.createApplication(req.user.id, req.body);
    res.json(success(result, '申请提交成功'));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function getApplicationList(req, res) {
  try {
    const result = await applicationService.getApplicationList(
      req.user.id,
      req.user.role,
      req.query
    );
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function getApplicationDetail(req, res) {
  try {
    const result = await applicationService.getApplicationDetail(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function updateApplicationStatus(req, res) {
  try {
    const result = await applicationService.updateApplicationStatus(
      req.params.id,
      req.user.id,
      req.body
    );
    res.json(success(result, '操作成功'));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}
