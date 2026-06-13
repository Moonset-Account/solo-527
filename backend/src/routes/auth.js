import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        ip: req.ip,
      },
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        company: user.company,
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'LOGOUT',
        module: 'AUTH',
        ip: req.ip,
      },
    });

    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        email: email || undefined,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        company: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('更新资料失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;
