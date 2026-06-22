import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.js';
import { success, error } from '../utils/response.js';
import * as pricingService from '../services/pricing.service.js';

export const createPlanValidators = [
  body('pluginId').isInt().withMessage('插件ID不能为空'),
  body('name').notEmpty().withMessage('套餐名称不能为空'),
  body('code').notEmpty().withMessage('套餐编码不能为空'),
  body('seatCount').isInt({ min: 1 }).withMessage('席位数量必须大于0'),
  body('billingCycle').isIn(['MONTHLY', 'QUARTERLY', 'YEARLY']).withMessage('账期类型不正确'),
  body('price').isFloat({ min: 0 }).withMessage('价格不能为负数'),
  validateRequest,
];

export async function getPlanList(req, res) {
  try {
    const result = await pricingService.getPlanList(req.query);
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function createPlan(req, res) {
  try {
    const result = await pricingService.createPlan(req.body);
    res.json(success(result, '创建成功'));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function updatePlan(req, res) {
  try {
    const result = await pricingService.updatePlan(req.params.id, req.body);
    res.json(success(result, '更新成功'));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}
