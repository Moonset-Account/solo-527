const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');
const { getDb } = require('../utils/database');

const ROLE_PERMISSIONS = {
  admin: [
    'user:manage', 'user:view',
    'ticket:view_all', 'ticket:assign', 'ticket:review', 'ticket:close', 'ticket:escalate',
    'review:approve', 'review:reject', 'review:modify',
    'data:import', 'data:export',
    'model:configure', 'model:evaluate', 'model:retrain',
    'stats:view_all',
    'system:configure',
  ],
  supervisor: [
    'user:view',
    'ticket:view_all', 'ticket:review', 'ticket:close', 'ticket:escalate',
    'review:approve', 'review:reject', 'review:modify',
    'data:export',
    'model:evaluate',
    'stats:view_all',
  ],
  operator: [
    'ticket:view_all', 'ticket:assign',
    'review:submit',
    'stats:view_basic',
  ],
};

function initDefaultUsers() {
  const db = getDb();
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount > 0) return;

  const insert = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, department, created_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
  `);

  const users = [
    { id: uuidv4(), email: config.defaults.admin.email, name: '系统管理员', role: 'admin', dept: '信息中心', pw: config.defaults.admin.password },
    { id: uuidv4(), email: config.defaults.supervisor.email, name: '热线主管', role: 'supervisor', dept: '街道热线办', pw: config.defaults.supervisor.password },
    { id: uuidv4(), email: config.defaults.operator.email, name: '接线员小王', role: 'operator', dept: '街道热线办', pw: config.defaults.operator.password },
  ];

  for (const u of users) {
    const hash = bcrypt.hashSync(u.pw, 10);
    insert.run(u.id, u.email, hash, u.name, u.role, u.dept);
    logger.info(`Default user created: ${u.email} / ${u.role}`);
  }
}

function initRolePermissions() {
  const db = getDb();
  const insert = db.prepare(`INSERT OR REPLACE INTO role_permissions (role, permissions) VALUES (?, ?)`);
  for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
    insert.run(role, JSON.stringify(perms));
  }
}

function generateToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    permissions: ROLE_PERMISSIONS[user.role] || [],
  };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (e) {
    logger.warn('Token verification failed', { error: e.message });
    return null;
  }
}

async function authenticate(email, password) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user) {
    logger.warn('Login failed: user not found', { email });
    return null;
  }
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    logger.warn('Login failed: wrong password', { email });
    return null;
  }
  db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  const token = generateToken(user);
  logger.info('User authenticated', { email, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      permissions: ROLE_PERMISSIONS[user.role] || [],
    },
  };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ code: 401, message: '认证令牌无效或已过期' });
  }
  req.user = decoded;
  next();
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未认证' });
    }
    const perms = req.user.permissions || [];
    if (!perms.includes(permission)) {
      logger.warn('Permission denied', { user: req.user.email, permission });
      return res.status(403).json({ code: 403, message: '权限不足' });
    }
    next();
  };
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '角色权限不足' });
    }
    next();
  };
}

function listUsers(filter = {}) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, email, name, role, department, created_at, last_login_at, is_active
    FROM users
    ORDER BY created_at DESC
  `).all();
  return rows;
}

function changePassword(userId, oldPassword, newPassword) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('用户不存在');
  if (oldPassword && !bcrypt.compareSync(oldPassword, user.password_hash)) {
    throw new Error('原密码错误');
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, userId);
  return true;
}

module.exports = {
  ROLE_PERMISSIONS,
  initDefaultUsers,
  initRolePermissions,
  authenticate,
  generateToken,
  verifyToken,
  authMiddleware,
  requirePermission,
  requireRole,
  listUsers,
  changePassword,
};
