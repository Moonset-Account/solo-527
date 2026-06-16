const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId).select('-password').populate('store');
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: '认证失败' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' });
    }
    next();
  };
};

module.exports = { authMiddleware, requireRole };
