const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { error } = require('../utils/response');

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(error('未提供认证令牌', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json(error('用户不存在', 401));
    }

    if (user.status !== 'active') {
      return res.status(403).json(error('账号已被禁用', 403));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(error('令牌已过期', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json(error('无效的令牌', 401));
    }
    return res.status(401).json(error('认证失败', 401));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(error('未认证', 401));
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(error('权限不足', 403));
    }
    next();
  };
}

module.exports = {
  auth,
  requireRole,
};
