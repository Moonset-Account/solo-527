import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.js';
import { success, error } from '../utils/response.js';
import * as authService from '../services/auth.service.js';

export const loginValidators = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
  validateRequest,
];

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(success(result, '登录成功'));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function getMe(req, res) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json(success(user));
  } catch (err) {
    res.status(500).json(error(err.message, 500));
  }
}
