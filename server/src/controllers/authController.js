const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const { logOperation } = require('../services/operationLogService');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return errorResponse(res, '用户名和密码不能为空');
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      await logOperation({
        username,
        module: 'auth',
        action: 'login',
        description: `登录失败: 用户不存在`,
        req,
        status: 'failed',
        errorMessage: '用户不存在'
      });
      return errorResponse(res, '用户名或密码错误', 401);
    }

    if (user.status !== 'active') {
      await logOperation({
        user,
        module: 'auth',
        action: 'login',
        description: `登录失败: 用户已禁用`,
        req,
        status: 'failed',
        errorMessage: '用户已禁用'
      });
      return errorResponse(res, '账户已被禁用', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logOperation({
        user,
        module: 'auth',
        action: 'login',
        description: `登录失败: 密码错误`,
        req,
        status: 'failed',
        errorMessage: '密码错误'
      });
      return errorResponse(res, '用户名或密码错误', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    await logOperation({
      user,
      store: user.store,
      module: 'auth',
      action: 'login',
      description: `用户 ${user.username} 登录成功`,
      req,
      status: 'success'
    });

    const userData = user.toObject();
    delete userData.password;

    successResponse(res, { token, user: userData }, '登录成功');
  } catch (error) {
    errorResponse(res, error.message || '登录失败', 500);
  }
};

const register = async (req, res) => {
  try {
    const { username, password, name, role, storeId } = req.body;

    if (!username || !password || !name) {
      return errorResponse(res, '用户名、密码和姓名不能为空');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return errorResponse(res, '用户名已存在');
    }

    const user = new User({
      username,
      password,
      name,
      role: role || 'store_manager',
      store: storeId || null
    });

    await user.save();

    await logOperation({
      user: req.user,
      store: req.user?.store,
      module: 'user',
      action: 'create',
      targetType: 'User',
      targetId: user._id,
      description: `创建用户: ${username}`,
      req,
      status: 'success'
    });

    const userData = user.toObject();
    delete userData.password;

    successResponse(res, { user: userData }, '注册成功');
  } catch (error) {
    errorResponse(res, error.message || '注册失败', 500);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('store');
    successResponse(res, { user }, '获取成功');
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return errorResponse(res, '原密码错误');
    }

    user.password = newPassword;
    await user.save();

    await logOperation({
      user,
      store: user.store,
      module: 'auth',
      action: 'change_password',
      targetType: 'User',
      targetId: user._id,
      description: `用户修改密码`,
      req,
      status: 'success'
    });

    successResponse(res, null, '密码修改成功');
  } catch (error) {
    errorResponse(res, error.message || '修改失败', 500);
  }
};

const logout = async (req, res) => {
  try {
    await logOperation({
      user: req.user,
      store: req.user?.store,
      module: 'auth',
      action: 'logout',
      description: `用户 ${req.user.username} 退出登录`,
      req,
      status: 'success'
    });
    successResponse(res, null, '退出成功');
  } catch (error) {
    errorResponse(res, error.message || '退出失败', 500);
  }
};

module.exports = {
  login,
  register,
  getCurrentUser,
  changePassword,
  logout
};
