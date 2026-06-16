const InspectionTask = require('../models/InspectionTask');
const { successResponse, errorResponse, paginationQuery, generateRandomString } = require('../utils/response');
const { logOperation, getFieldChanges } = require('../services/operationLogService');

const KEY_FIELDS = ['status', 'scheduledDate', 'dueDate', 'score'];

const generateTaskNo = async () => {
  let taskNo;
  let exists;
  do {
    taskNo = 'IT' + Date.now().toString().slice(-8) + generateRandomString(4);
    exists = await InspectionTask.findOne({ taskNo });
  } while (exists);
  return taskNo;
};

const getInspectionList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, storeId, type, status, assignedTo } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

    const query = {};
    if (storeId) query.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }
    if (type) query.type = type;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const list = await InspectionTask.find(query)
      .populate('store assignedTo assignedBy')
      .skip(skip)
      .limit(limit)
      .sort({ scheduledDate: -1 });
    
    const total = await InspectionTask.countDocuments(query);

    successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getInspectionById = async (req, res) => {
  try {
    const task = await InspectionTask.findById(req.params.id)
      .populate('store assignedTo assignedBy');
    if (!task) {
      return errorResponse(res, '巡店任务不存在', 404);
    }
    successResponse(res, { task });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const createInspection = async (req, res) => {
  try {
    const { store, title, type, scheduledDate, dueDate, assignedTo, checklist, reminderDays, impactOnProfit, profitNote, notes } = req.body;

    if (!store || !title || !scheduledDate) {
      return errorResponse(res, '门店、标题和计划日期不能为空');
    }

    const taskNo = await generateTaskNo();

    const task = new InspectionTask({
      store,
      taskNo,
      title,
      type: type || 'daily',
      scheduledDate,
      dueDate,
      assignedTo,
      assignedBy: req.user._id,
      checklist: checklist || [],
      reminderDays: reminderDays || 1,
      impactOnProfit: impactOnProfit || 0,
      profitNote,
      notes
    });

    await task.save();
    await task.populate('store assignedTo assignedBy');

    await logOperation({
      user: req.user,
      store: store,
      module: 'inspection',
      action: 'create',
      targetType: 'InspectionTask',
      targetId: task._id,
      description: `创建巡店任务: ${title}`,
      req,
      status: 'success'
    });

    successResponse(res, { task }, '创建成功');
  } catch (error) {
    errorResponse(res, error.message || '创建失败', 500);
  }
};

const updateInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const oldTask = await InspectionTask.findById(id);
    if (!oldTask) {
      return errorResponse(res, '巡店任务不存在', 404);
    }

    const updates = req.body;
    const updatedTask = await InspectionTask.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('store assignedTo assignedBy');

    const fieldChanges = getFieldChanges(oldTask.toObject(), updates, KEY_FIELDS);
    
    await logOperation({
      user: req.user,
      store: updatedTask.store,
      module: 'inspection',
      action: 'update',
      targetType: 'InspectionTask',
      targetId: updatedTask._id,
      description: `更新巡店任务: ${updatedTask.title}`,
      fieldChanges,
      req,
      status: 'success'
    });

    successResponse(res, { task: updatedTask }, '更新成功');
  } catch (error) {
    errorResponse(res, error.message || '更新失败', 500);
  }
};

const startInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await InspectionTask.findById(id);
    
    if (!task) {
      return errorResponse(res, '巡店任务不存在', 404);
    }
    if (task.status !== 'scheduled' && task.status !== 'overdue') {
      return errorResponse(res, '该任务无法开始');
    }

    task.status = 'in_progress';
    task.startedAt = new Date();
    await task.save();
    await task.populate('store assignedTo assignedBy');

    await logOperation({
      user: req.user,
      store: task.store,
      module: 'inspection',
      action: 'start',
      targetType: 'InspectionTask',
      targetId: task._id,
      description: `开始巡店: ${task.title}`,
      fieldChanges: [{ field: 'status', oldValue: task.status, newValue: 'in_progress' }],
      req,
      status: 'success'
    });

    successResponse(res, { task }, '已开始');
  } catch (error) {
    errorResponse(res, error.message || '操作失败', 500);
  }
};

const completeInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist, score, notes, impactOnProfit, profitNote } = req.body;
    const task = await InspectionTask.findById(id);
    
    if (!task) {
      return errorResponse(res, '巡店任务不存在', 404);
    }
    if (task.status === 'completed') {
      return errorResponse(res, '该任务已完成');
    }

    task.status = 'completed';
    task.checklist = checklist || task.checklist;
    task.score = score !== undefined ? score : task.score;
    task.notes = notes !== undefined ? notes : task.notes;
    task.impactOnProfit = impactOnProfit !== undefined ? impactOnProfit : task.impactOnProfit;
    task.profitNote = profitNote !== undefined ? profitNote : task.profitNote;
    task.completedAt = new Date();

    await task.save();
    await task.populate('store assignedTo assignedBy');

    await logOperation({
      user: req.user,
      store: task.store,
      module: 'inspection',
      action: 'complete',
      targetType: 'InspectionTask',
      targetId: task._id,
      description: `完成巡店: ${task.title}`,
      fieldChanges: [{ field: 'status', oldValue: task.status, newValue: 'completed' }],
      req,
      status: 'success'
    });

    successResponse(res, { task }, '已完成');
  } catch (error) {
    errorResponse(res, error.message || '操作失败', 500);
  }
};

const deleteInspection = async (req, res) => {
  try {
    const task = await InspectionTask.findById(req.params.id);
    if (!task) {
      return errorResponse(res, '巡店任务不存在', 404);
    }

    await InspectionTask.findByIdAndDelete(req.params.id);

    await logOperation({
      user: req.user,
      module: 'inspection',
      action: 'delete',
      targetType: 'InspectionTask',
      targetId: req.params.id,
      description: `删除巡店任务: ${task.title}`,
      req,
      status: 'success'
    });

    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, error.message || '删除失败', 500);
  }
};

module.exports = {
  getInspectionList,
  getInspectionById,
  createInspection,
  updateInspection,
  startInspection,
  completeInspection,
  deleteInspection
};
