const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const { createAuditLog } = require('../utils/auditLog');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    await User.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
      lastLoginIp: req.ip
    });
    
    await createAuditLog({
      action: 'login',
      entityType: 'user',
      entityId: user._id,
      operatorId: user._id,
      operatorName: user.name,
      ipAddress: req.ip,
      remark: '用户登录'
    });
    
    const userInfo = user.toObject();
    delete userInfo.password;
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: userInfo
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
}

async function getCurrentUser(req, res) {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
}

async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    await createAuditLog({
      action: 'update',
      entityType: 'user',
      entityId: user._id,
      operatorId: user._id,
      operatorName: user.name,
      ipAddress: req.ip,
      remark: '修改密码'
    });
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '密码修改失败',
      error: error.message
    });
  }
}

module.exports = {
  login,
  getCurrentUser,
  changePassword
};
