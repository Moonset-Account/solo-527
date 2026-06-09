const AuthService = require('../services/authService');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: '认证令牌无效或已过期' });
    }

    const user = await AuthService.getUserById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }

    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.userIp = req.ip || req.connection.remoteAddress;
    req.userAgent = req.headers['user-agent'];
    req.requestId = require('uuid').v4();

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: '认证处理失败' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        error: '权限不足',
        required_roles: roles,
        current_role: req.userRole,
      });
    }

    next();
  };
};

const canApproveRisk = (req, res, next) => {
  if (['reviewer', 'admin'].includes(req.userRole)) {
    return next();
  }
  return res.status(403).json({ error: '需要复核人或管理员权限' });
};

const canManageContract = (req, res, next) => {
  if (['assistant', 'admin'].includes(req.userRole)) {
    return next();
  }
  return res.status(403).json({ error: '需要法务助理或管理员权限' });
};

const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '登录尝试次数过多，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authenticate,
  requireRole,
  canApproveRisk,
  canManageContract,
  apiLimiter,
  authLimiter,
};
