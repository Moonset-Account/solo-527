const db = require('../db/pool');

function rbac(requiredPermission) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    try {
      const { rows } = await db.query(
        `SELECT p.code FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
         JOIN roles r ON r.id = rp.role_id
         JOIN operators o ON o.role_id = r.id
         WHERE o.id = $1`,
        [req.user.id]
      );

      const permissions = rows.map(r => r.code);

      if (permissions.includes(requiredPermission)) {
        return next();
      }

      return res.status(403).json({ error: `权限不足，需要: ${requiredPermission}` });
    } catch (err) {
      console.error('RBAC检查失败:', err.message);
      return res.status(500).json({ error: '权限检查失败' });
    }
  };
}

module.exports = rbac;
