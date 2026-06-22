import { validationResult } from 'express-validator';
import { error } from '../utils/response.js';

export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json(error(firstError.msg, 400));
  }
  next();
}
