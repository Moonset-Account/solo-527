const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { createAuditLog, sanitizeUser } = require('../middleware/permissions');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.register = async (req, res) => {
  try {
    const { username, password, phone, realName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const user = await User.create({
      username,
      password,
      phone,
      realName,
      role: 'resident'
    });

    await createAuditLog(user.id, 'register', 'User', user.id, { username }, req.ip);

    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: sanitizeUser(user, user.role)
    });
  } catch (error) {
    res.status(500).json({ error: '注册失败', details: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    await createAuditLog(user.id, 'login', 'User', user.id, null, req.ip);

    const token = generateToken(user.id);
    res.json({
      token,
      user: sanitizeUser(user, user.role)
    });
  } catch (error) {
    res.status(500).json({ error: '登录失败', details: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    res.json({
      user: sanitizeUser(req.user, req.user.role)
    });
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { realName, phone, idCard } = req.body;
    
    const updateData = {};
    if (realName !== undefined) updateData.realName = realName;
    if (phone !== undefined) updateData.phone = phone;
    if (idCard !== undefined) {
      updateData.idCard = idCard;
      if (realName && idCard) {
        updateData.verified = true;
      }
    }

    await req.user.update(updateData);
    await createAuditLog(req.user.id, 'update_profile', 'User', req.user.id, updateData, req.ip);

    res.json({
      user: sanitizeUser(req.user, req.user.role)
    });
  } catch (error) {
    res.status(500).json({ error: '更新资料失败', details: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    const sanitizedUsers = users.map(u => sanitizeUser(u, req.user.role));
    res.json({ users: sanitizedUsers });
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    await user.update({ verified: true });
    await createAuditLog(req.user.id, 'verify_user', 'User', id, null, req.ip);

    res.json({ user: sanitizeUser(user, req.user.role) });
  } catch (error) {
    res.status(500).json({ error: '认证用户失败' });
  }
};
