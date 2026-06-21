const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400);
    }
    
    const user = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!user) {
      return error(res, '用户名或密码错误', 401);
    }
    
    if (user.status !== 'active') {
      return error(res, '账号已被禁用', 403);
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return error(res, '用户名或密码错误', 401);
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    await logger.operation(user.id, 'login', 'auth', user.id, 'user', '用户登录', req);
    
    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    }, '登录成功');
  } catch (err) {
    logger.error('登录失败', { error: err.message, username: req.body.username });
    error(res, '登录失败', 500);
  }
}

async function logout(req, res) {
  try {
    if (req.user) {
      await logger.operation(req.user.id, 'logout', 'auth', req.user.id, 'user', '用户登出', req);
    }
    success(res, null, '登出成功');
  } catch (err) {
    logger.error('登出失败', { error: err.message });
    error(res, '登出失败', 500);
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });
    
    success(res, user, '获取成功');
  } catch (err) {
    logger.error('获取当前用户信息失败', { error: err.message });
    error(res, '获取用户信息失败', 500);
  }
}

module.exports = {
  login,
  logout,
  getCurrentUser,
};
