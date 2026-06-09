const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const models = require('../models');
const config = require('../config');

class AuthService {
  async login(username, password) {
    const user = await models.User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username: username },
          { email: username },
        ],
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (!user.is_active) {
      throw new Error('账户已被禁用');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('密码错误');
    }

    await user.update({ last_login_at: new Date() });

    const token = this._generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async register(userData, createdByRole = null) {
    const { username, email, password, full_name, role } = userData;

    if (createdByRole && createdByRole !== 'admin' && role === 'admin') {
      throw new Error('无权限创建管理员账户');
    }

    const existing = await models.User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ username }, { email }],
      },
    });

    if (existing) {
      throw new Error('用户名或邮箱已存在');
    }

    const user = await models.User.create({
      username,
      email,
      password_hash: password,
      full_name,
      role: role || 'assistant',
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }

  async getUserById(userId) {
    const user = await models.User.findByPk(userId);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    };
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await models.User.findByPk(userId);
    if (!user) throw new Error('用户不存在');

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) throw new Error('原密码错误');

    const newHash = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: newHash });

    return true;
  }

  _generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  async listUsers(role = null) {
    const where = {};
    if (role) where.role = role;

    const users = await models.User.findAll({
      where,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'username', 'email', 'full_name', 'role', 'is_active', 'created_at', 'last_login_at'],
    });

    return users;
  }
}

module.exports = new AuthService();
