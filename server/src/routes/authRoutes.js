const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
  validateRequest
], authController.login);

router.get('/me', authMiddleware, authController.getCurrentUser);

router.post('/change-password', authMiddleware, [
  body('oldPassword').notEmpty().withMessage('原密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位'),
  validateRequest
], authController.changePassword);

module.exports = router;
