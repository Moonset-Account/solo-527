import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.js';
import { success, error } from '../utils/response.js';
import * as trialService from '../services/trial.service.js';

export const handleValidators = [
  body('result').isIn(['CONVERT', 'CLOSE', 'EXTEND']).withMessage('处理结果不正确'),
  body('remark').optional().isString(),
  body('extendDays').optional().isInt({ min: 1, max: 30 }).withMessage('延期天数需在1-30天之间'),
  validateRequest,
];

export async function getTrialList(req, res) {
  try {
    const result = await trialService.getTrialList(req.query);
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function handleTrial(req, res) {
  try {
    const result = await trialService.handleTrial(
      req.params.id,
      req.user.id,
      req.body
    );
    res.json(success(result, '处理成功'));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}
