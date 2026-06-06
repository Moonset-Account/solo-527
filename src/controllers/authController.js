const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateToken } = require('../middleware/auth');
const { logger, logAudit } = require('../utils/logger');
const { AppError, ValidationError } = require('../middleware/error');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ValidationError('用户名和密码不能为空');
    }

    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND status = $2',
      [username, 'active']
    );

    if (result.rows.length === 0) {
      throw new AppError('用户名或密码错误', 401, 'AUTH_FAILED');
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError('用户名或密码错误', 401, 'AUTH_FAILED');
    }

    const token = generateToken(user);

    await logAudit(user.id, user.real_name, 'login', 'auth', null, null, null, null, req);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const result = await db.query(
      'SELECT id, username, real_name, role, department, phone, email, status, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        email: user.email,
        status: user.status,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new ValidationError('旧密码和新密码不能为空');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('新密码长度不能少于6位');
    }

    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const isValidPassword = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      throw new AppError('旧密码错误', 400, 'OLD_PASSWORD_WRONG');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    await logAudit(req.user.id, req.user.realName, 'change_password', 'auth', 'user', req.user.id, null, null, req);

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getCurrentUser,
  changePassword,
};
