import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: '账号已被禁用' });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    req.session.user = {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
    };
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/init', async (req, res, next) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return res.status(400).json({ error: '系统已初始化' });
    }
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'admin',
      email: 'admin@example.com',
    });
    await admin.save();

    const editorPassword = await bcrypt.hash('editor123', 10);
    const editor = new User({
      username: 'chief_editor',
      password: editorPassword,
      name: '张主编',
      role: 'chief_editor',
      department: '编辑部',
      email: 'chief@example.com',
    });
    await editor.save();

    const reporterPassword = await bcrypt.hash('reporter123', 10);
    const reporter = new User({
      username: 'reporter1',
      password: reporterPassword,
      name: '李记者',
      role: 'reporter',
      department: '时政部',
      email: 'reporter1@example.com',
    });
    await reporter.save();

    const reporter2 = new User({
      username: 'reporter2',
      password: reporterPassword,
      name: '王记者',
      role: 'reporter',
      department: '财经部',
      email: 'reporter2@example.com',
    });
    await reporter2.save();

    res.json({ success: true, message: '初始化成功，已创建默认账号' });
  } catch (err) {
    next(err);
  }
});

export default router;
