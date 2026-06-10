const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return error(res, '未提供认证令牌', 401);
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return error(res, '认证令牌无效或已过期', 401);
  }

  req.user = decoded;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, '未登录', 401);
    }

    if (!roles.includes(req.user.role)) {
      return error(res, '权限不足', 403);
    }

    next();
  };
}

module.exports = {
  auth,
  requireRole,
};
