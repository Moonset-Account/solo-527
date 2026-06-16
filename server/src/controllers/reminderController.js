const Reminder = require('../models/Reminder');
const { successResponse, errorResponse, paginationQuery } = require('../utils/response');
const { logOperation } = require('../services/operationLogService');

const getReminders = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type, status, priority, storeId } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (storeId) query.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }

    const list = await Reminder.find(query)
      .populate('store assignedTo processedBy')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Reminder.countDocuments(query);
    const unreadCount = await Reminder.countDocuments({ ...query, status: 'pending' });

    successResponse(res, { list, total, unreadCount, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getReminderById = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id).populate('store assignedTo processedBy');
    if (!reminder) {
      return errorResponse(res, '提醒不存在', 404);
    }
    successResponse(res, { reminder });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const createReminder = async (store, type, priority, title, content, options = {}) => {
  try {
    const reminder = new Reminder({
      store,
      type,
      priority,
      title,
      content,
      relatedId: options.relatedId,
      relatedType: options.relatedType,
      ruleName: options.ruleName,
      dueDate: options.dueDate,
      assignedTo: options.assignedTo
    });
    await reminder.save();
    return reminder;
  } catch (error) {
    console.error('Failed to create reminder:', error);
    return null;
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findById(id);
    
    if (!reminder) {
      return errorResponse(res, '提醒不存在', 404);
    }

    reminder.status = 'read';
    reminder.readAt = new Date();
    await reminder.save();

    successResponse(res, { reminder }, '已标记为已读');
  } catch (error) {
    errorResponse(res, error.message || '操作失败', 500);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const { storeId, type } = req.query;
    const query = { status: 'pending' };
    if (storeId) query.store = storeId;
    if (type) query.type = type;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }

    await Reminder.updateMany(query, { status: 'read', readAt: new Date() });

    successResponse(res, null, '全部标记为已读');
  } catch (error) {
    errorResponse(res, error.message || '操作失败', 500);
  }
};

const processReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { processNote, status = 'processed' } = req.body;
    const reminder = await Reminder.findById(id);
    
    if (!reminder) {
      return errorResponse(res, '提醒不存在', 404);
    }

    reminder.status = status;
    reminder.processNote = processNote;
    reminder.processedBy = req.user._id;
    reminder.processedAt = new Date();
    await reminder.save();
    await reminder.populate('store processedBy');

    await logOperation({
      user: req.user,
      store: reminder.store,
      module: 'reminder',
      action: 'process',
      targetType: 'Reminder',
      targetId: reminder._id,
      description: `处理催办提醒: ${reminder.title}`,
      req,
      status: 'success'
    });

    successResponse(res, { reminder }, '处理成功');
  } catch (error) {
    errorResponse(res, error.message || '处理失败', 500);
  }
};

const dismissReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findById(id);
    
    if (!reminder) {
      return errorResponse(res, '提醒不存在', 404);
    }

    reminder.status = 'dismissed';
    await reminder.save();

    successResponse(res, { reminder }, '已忽略');
  } catch (error) {
    errorResponse(res, error.message || '操作失败', 500);
  }
};

const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return errorResponse(res, '提醒不存在', 404);
    }

    await Reminder.findByIdAndDelete(req.params.id);
    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, error.message || '删除失败', 500);
  }
};

module.exports = {
  getReminders,
  getReminderById,
  createReminder,
  markAsRead,
  markAllAsRead,
  processReminder,
  dismissReminder,
  deleteReminder
};
