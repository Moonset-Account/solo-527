const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      role: user.role,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供访问令牌' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    logger.warn(`Token verification failed: ${error.message}`);
    return res.status(403).json({ success: false, message: '无效或过期的令牌' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未认证' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`User ${req.user.username} attempted to access restricted area. Role: ${req.user.role}, Required: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    next();
  };
}

const ROLES = {
  ADMIN: 'admin',
  HEAD_NURSE: 'head_nurse',
  NURSE: 'nurse',
  EQUIPMENT: 'equipment',
};

const PERMISSIONS = {
  USER_MANAGE: [ROLES.ADMIN],
  SCHEDULE_VIEW: [ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE, ROLES.EQUIPMENT],
  SCHEDULE_MANAGE: [ROLES.ADMIN, ROLES.HEAD_NURSE],
  PACKAGE_VIEW: [ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE, ROLES.EQUIPMENT],
  PACKAGE_PREPARE: [ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE],
  PACKAGE_REVIEW: [ROLES.ADMIN, ROLES.HEAD_NURSE],
  PACKAGE_CONFIRM: [ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE],
  INVENTORY_VIEW: [ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE, ROLES.EQUIPMENT],
  INVENTORY_MANAGE: [ROLES.ADMIN, ROLES.EQUIPMENT],
  BATCH_MANAGE: [ROLES.ADMIN, ROLES.EQUIPMENT],
  PICKUP_CONFIRM: [ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE],
  RETURN_MANAGE: [ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.NURSE, ROLES.EQUIPMENT],
  RECONCILIATION_VIEW: [ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.EQUIPMENT],
  RECONCILIATION_MANAGE: [ROLES.ADMIN, ROLES.EQUIPMENT],
  REPORT_EXPORT: [ROLES.ADMIN, ROLES.HEAD_NURSE, ROLES.EQUIPMENT],
  DATA_IMPORT: [ROLES.ADMIN, ROLES.EQUIPMENT],
};

function checkPermission(permission) {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    return (req, res, next) => next();
  }
  return requireRole(...allowedRoles);
}

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  checkPermission,
  ROLES,
  PERMISSIONS,
};
