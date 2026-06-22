import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.js';
import { success, error } from '../utils/response.js';
import * as userService from '../services/user.service.js';

export const createUserValidators = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  validateRequest,
];

export async function getUserList(req, res) {
  try {
    const result = await userService.getUserList(req.query);
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function createUser(req, res) {
  try {
    const result = await userService.createUser(req.body);
    res.json(success(result, '创建成功'));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function updateUser(req, res) {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    res.json(success(result, '更新成功'));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function getDepartmentList(req, res) {
  try {
    const result = await userService.getDepartmentList();
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}
