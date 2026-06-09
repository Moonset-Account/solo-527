const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const { authLimiter, authenticate } = require('../middleware/auth');

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请提供用户名和密码' });
    }

    const result = await AuthService.login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/register', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '仅管理员可创建新用户' });
    }

    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const user = await AuthService.register(
      { username, email, password, full_name, role },
      req.userRole
    );

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await AuthService.getUserById(req.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ error: '请提供原密码和新密码' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: '新密码至少8位' });
    }

    await AuthService.changePassword(req.userId, old_password, new_password);
    res.json({ message: '密码修改成功' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/users', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: '仅管理员可查看用户列表' });
    }

    const users = await AuthService.listUsers(req.query.role);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
