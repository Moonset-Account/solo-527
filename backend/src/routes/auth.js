const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { loginSchema, userSchema, validate } = require('../utils/validation');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', authenticate, async (req, res, next) => {
  try {
    res.json({
      code: 200,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authenticate, (req, res) => {
  res.json({ code: 200, message: '退出成功' });
});

router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: 200, data: users });
  } catch (error) {
    next(error);
  }
});

router.post('/users', authenticate, requireAdmin, validate(userSchema), async (req, res, next) => {
  try {
    const { password, ...userData } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({ code: 200, message: '创建成功', data: user });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password, ...userData } = req.body;

    const updateData = { ...userData };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({ code: 200, message: '更新成功', data: user });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
