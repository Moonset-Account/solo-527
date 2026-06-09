const express = require('express');
const router = express.Router();
const { authenticate, authMiddleware, requirePermission, listUsers, changePassword } = require('../services/authService');
const logger = require('../utils/logger');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ code: 400, message: '请提供邮箱和密码' });
    }
    const result = await authenticate(email, password);
    if (!result) {
      return res.status(401).json({ code: 401, message: '邮箱或密码错误' });
    }
    res.json({ code: 0, message: '登录成功', data: result });
  } catch (e) {
    logger.error('Login error', { error: e.message });
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ code: 0, data: { user: req.user } });
});

router.get('/users', authMiddleware, requirePermission('user:view'), (req, res) => {
  res.json({ code: 0, data: listUsers() });
});

router.post('/change-password', authMiddleware, (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ code: 400, message: '新密码至少8位' });
    }
    changePassword(req.user.sub, old_password, new_password);
    res.json({ code: 0, message: '密码修改成功' });
  } catch (e) {
    res.status(400).json({ code: 400, message: e.message });
  }
});

module.exports = router;
