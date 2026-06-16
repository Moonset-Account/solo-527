const RectificationTask = require('../models/RectificationTask');
const { successResponse, errorResponse, paginationQuery, generateRandomString } = require('../utils/response');
const { logOperation, getFieldChanges } = require('../services/operationLogService');

const KEY_FIELDS = ['status', 'priority', 'dueDate', 'impactOnProfit'];

const generateTaskNo = async () => {
  let taskNo;
  let exists;
  do {
    taskNo = 'RT' + Date.now().toString().slice(-8) + generateRandomString(4);
    exists = await RectificationTask.findOne({ taskNo });
  } while (exists);
  return taskNo;
};

const getTaskList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, storeId, type, priority, status, assignedTo } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

    const query = {};
    if (storeId) query.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const list = await RectificationTask.find(query)
      .populate('store assignedTo assignedBy reviewedBy relatedAnomaly')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await RectificationTask.countDocuments(query);

    successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await RectificationTask.findById(req.params.id)
      .populate('store assignedTo assignedBy reviewedBy relatedAnomaly');
    if (!task) {
      return errorResponse(res, '任务不存在', 404);
    }
    successResponse(res, { task });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const createTask = async (req, res) => {
  try {
    const { store, title, description, type, priority, assignedTo, dueDate, relatedAnomaly, images, impactOnProfit, profitNote } = req.body;

    if (!store || !title) {
      return errorResponse(res, '门店和标题不能为空');
    }

    const taskNo = await generateTaskNo();

    const task = new RectificationTask({
      store,
      taskNo,
      title,
      description,
      type: type || 'other',
      priority: priority || 'medium',
      assignedTo,
      assignedBy: req.user._id,
      dueDate,
      relatedAnomaly,
      images: images || [],
      impactOnProfit: impactOnProfit || 0,
      profitNote
    });

    await task.save();
    await task.populate('store assignedTo assignedBy relatedAnomaly');

    await logOperation({
      user: req.user,
      store: store,
      module: 'rectification',
      action: 'create',
      targetType: 'RectificationTask',
      targetId: task._id,
      description: `下发整改任务: ${title}`,
      req,
      status: 'success'
    });

    successResponse(res, { task }, '创建成功');
  } catch (error) {
    errorResponse(res, error.message || '创建失败', 500);
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const oldTask = await RectificationTask.findById(id);
    if (!oldTask) {
      return errorResponse(res, '任务不存在', 404);
    }

    const updates = req.body;
    const updatedTask = await RectificationTask.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('store assignedTo assignedBy reviewedBy');

    const fieldChanges = getFieldChanges(oldTask.toObject(), updates, KEY_FIELDS);
    
    await logOperation({
      user: req.user,
      store: updatedTask.store,
      module: 'rectification',
      action: 'update',
      targetType: 'RectificationTask',
      targetId: updatedTask._id,
      description: `更新整改任务: ${updatedTask.title}`,
      fieldChanges,
      req,
      status: 'success'
    });

    successResponse(res, { task: updatedTask }, '更新成功');
  } catch (error) {
    errorResponse(res, error.message || '更新失败', 500);
  }
};

const submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionNote, submissionImages } = req.body;
    const task = await RectificationTask.findById(id);
    
    if (!task) {
      return errorResponse(res, '任务不存在', 404);
    }
    if (task.status === 'approved' || task.status === 'closed') {
      return errorResponse(res, '该任务已完成，不能提交');
    }

    task.status = 'submitted';
    task.submissionNote = submissionNote;
    task.submissionImages = submissionImages || [];
    task.submittedAt = new Date();

    await task.save();
    await task.populate('store assignedTo assignedBy');

    await logOperation({
      user: req.user,
      store: task.store,
      module: 'rectification',
      action: 'submit',
      targetType: 'RectificationTask',
      targetId: task._id,
      description: `提交整改任务: ${task.title}`,
      fieldChanges: [{ field: 'status', oldValue: task.status, newValue: 'submitted' }],
      req,
      status: 'success'
    });

    successResponse(res, { task }, '提交成功');
  } catch (error) {
    errorResponse(res, error.message || '提交失败', 500);
  }
};

const reviewTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, reviewNote, impactOnProfit, profitNote } = req.body;
    const task = await RectificationTask.findById(id);
    
    if (!task) {
      return errorResponse(res, '任务不存在', 404);
    }
    if (task.status !== 'submitted') {
      return errorResponse(res, '只能审核已提交的任务');
    }

    task.status = approved ? 'approved' : 'rejected';
    task.reviewNote = reviewNote;
    task.reviewedBy = req.user._id;
    task.reviewedAt = new Date();
    if (impactOnProfit !== undefined) task.impactOnProfit = impactOnProfit;
    if (profitNote !== undefined) task.profitNote = profitNote;

    await task.save();
    await task.populate('store assignedTo assignedBy reviewedBy');

    await logOperation({
      user: req.user,
      store: task.store,
      module: 'rectification',
      action: approved ? 'approve' : 'reject',
      targetType: 'RectificationTask',
      targetId: task._id,
      description: `${approved ? '通过' : '驳回'}整改任务: ${task.title}`,
      fieldChanges: [{ field: 'status', oldValue: 'submitted', newValue: approved ? 'approved' : 'rejected' }],
      req,
      status: 'success'
    });

    successResponse(res, { task }, approved ? '审核通过' : '已驳回');
  } catch (error) {
    errorResponse(res, error.message || '审核失败', 500);
  }
};

const closeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await RectificationTask.findById(id);
    
    if (!task) {
      return errorResponse(res, '任务不存在', 404);
    }

    task.status = 'closed';
    await task.save();
    await task.populate('store assignedTo assignedBy');

    await logOperation({
      user: req.user,
      store: task.store,
      module: 'rectification',
      action: 'close',
      targetType: 'RectificationTask',
      targetId: task._id,
      description: `关闭整改任务: ${task.title}`,
      fieldChanges: [{ field: 'status', oldValue: task.status, newValue: 'closed' }],
      req,
      status: 'success'
    });

    successResponse(res, { task }, '已关闭');
  } catch (error) {
    errorResponse(res, error.message || '操作失败', 500);
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await RectificationTask.findById(req.params.id);
    if (!task) {
      return errorResponse(res, '任务不存在', 404);
    }

    await RectificationTask.findByIdAndDelete(req.params.id);

    await logOperation({
      user: req.user,
      store: task.store,
      module: 'rectification',
      action: 'delete',
      targetType: 'RectificationTask',
      targetId: req.params.id,
      description: `删除整改任务: ${task.title}`,
      req,
      status: 'success'
    });

    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, error.message || '删除失败', 500);
  }
};

module.exports = {
  getTaskList,
  getTaskById,
  createTask,
  updateTask,
  submitTask,
  reviewTask,
  closeTask,
  deleteTask
};
