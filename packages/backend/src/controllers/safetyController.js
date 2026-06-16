const SafetyReminder = require('../models/SafetyReminder');

const getReminders = async (req, res) => {
  try {
    const { category, level, targetAudience, isActive, sortBy = 'sortOrder', sortOrder = 1 } = req.query;

    const query = {};
    if (category) query.category = category;
    if (level) query.level = level;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const reminders = await SafetyReminder.find(query)
      .sort({ isPinned: -1, [sortBy]: parseInt(sortOrder), createdAt: -1 });

    res.json({ data: reminders });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: '获取安全提醒失败' });
  }
};

const getReminder = async (req, res) => {
  try {
    const reminder = await SafetyReminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ message: '安全提醒不存在' });
    }

    res.json({ data: reminder });
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ message: '获取安全提醒详情失败' });
  }
};

const createReminder = async (req, res) => {
  try {
    const reminderData = {
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id
    };

    const reminder = new SafetyReminder(reminderData);
    await reminder.save();

    res.status(201).json({ data: reminder });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ message: '创建安全提醒失败' });
  }
};

const updateReminder = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const reminder = await SafetyReminder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: '安全提醒不存在' });
    }

    res.json({ data: reminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ message: '更新安全提醒失败' });
  }
};

const deleteReminder = async (req, res) => {
  try {
    const reminder = await SafetyReminder.findByIdAndDelete(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: '安全提醒不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ message: '删除安全提醒失败' });
  }
};

module.exports = {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder
};
