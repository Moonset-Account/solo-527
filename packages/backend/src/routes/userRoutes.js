const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { role, status } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

router.get('/trainers', async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer', status: 'active' }).select('-password');
    res.json({ data: trainers });
  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({ message: '获取训练师列表失败' });
  }
});

router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { username, password, name, role, phone, email } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      name,
      role,
      phone,
      email
    });

    await user.save();
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({ data: userData });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: '创建用户失败' });
  }
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: '更新用户失败' });
  }
});

module.exports = router;
