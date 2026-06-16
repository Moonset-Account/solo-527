const Anomaly = require('../models/Anomaly');
const { successResponse, errorResponse, paginationQuery } = require('../utils/response');
const { logOperation, getFieldChanges } = require('../services/operationLogService');

const KEY_FIELDS = ['status', 'level', 'type', 'impactOnProfit'];

const getAnomalyList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, storeId, type, level, status } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

    const query = {};
    if (storeId) query.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }
    if (type) query.type = type;
    if (level) query.level = level;
    if (status) query.status = status;

    const list = await Anomaly.find(query)
      .populate('store reportedBy resolvedBy relatedTask')
      .skip(skip)
      .limit(limit)
      .sort({ reportedAt: -1 });
    
    const total = await Anomaly.countDocuments(query);

    successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getAnomalyById = async (req, res) => {
  try {
    const anomaly = await Anomaly.findById(req.params.id)
      .populate('store reportedBy resolvedBy relatedTask');
    if (!anomaly) {
      return errorResponse(res, '异常记录不存在', 404);
    }
    successResponse(res, { anomaly });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const createAnomaly = async (req, res) => {
  try {
    const { store, type, level, title, description, location, images, impactOnProfit } = req.body;

    if (!store || !type || !title) {
      return errorResponse(res, '门店、类型和标题不能为空');
    }

    const anomaly = new Anomaly({
      store,
      type: type || 'other',
      level: level || 'moderate',
      title,
      description,
      location,
      images: images || [],
      reportedBy: req.user._id,
      impactOnProfit: impactOnProfit || 0
    });

    await anomaly.save();
    await anomaly.populate('store reportedBy');

    await logOperation({
      user: req.user,
      store: store,
      module: 'anomaly',
      action: 'create',
      targetType: 'Anomaly',
      targetId: anomaly._id,
      description: `录入异常: ${title}`,
      req,
      status: 'success'
    });

    successResponse(res, { anomaly }, '创建成功');
  } catch (error) {
    errorResponse(res, error.message || '创建失败', 500);
  }
};

const updateAnomaly = async (req, res) => {
  try {
    const { id } = req.params;
    const oldAnomaly = await Anomaly.findById(id);
    if (!oldAnomaly) {
      return errorResponse(res, '异常记录不存在', 404);
    }

    const updates = req.body;
    const updatedAnomaly = await Anomaly.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('store reportedBy resolvedBy');

    const fieldChanges = getFieldChanges(oldAnomaly.toObject(), updates, KEY_FIELDS);
    
    await logOperation({
      user: req.user,
      store: updatedAnomaly.store,
      module: 'anomaly',
      action: 'update',
      targetType: 'Anomaly',
      targetId: updatedAnomaly._id,
      description: `更新异常: ${updatedAnomaly.title}`,
      fieldChanges,
      req,
      status: 'success'
    });

    successResponse(res, { anomaly: updatedAnomaly }, '更新成功');
  } catch (error) {
    errorResponse(res, error.message || '更新失败', 500);
  }
};

const resolveAnomaly = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, impactOnProfit } = req.body;
    const anomaly = await Anomaly.findById(id);
    if (!anomaly) {
      return errorResponse(res, '异常记录不存在', 404);
    }

    anomaly.status = 'resolved';
    anomaly.resolution = resolution;
    anomaly.resolvedBy = req.user._id;
    anomaly.resolvedAt = new Date();
    if (impactOnProfit !== undefined) anomaly.impactOnProfit = impactOnProfit;

    await anomaly.save();
    await anomaly.populate('store reportedBy resolvedBy');

    await logOperation({
      user: req.user,
      store: anomaly.store,
      module: 'anomaly',
      action: 'resolve',
      targetType: 'Anomaly',
      targetId: anomaly._id,
      description: `处理异常: ${anomaly.title}`,
      fieldChanges: [{ field: 'status', oldValue: anomaly.status, newValue: 'resolved' }],
      req,
      status: 'success'
    });

    successResponse(res, { anomaly }, '处理成功');
  } catch (error) {
    errorResponse(res, error.message || '处理失败', 500);
  }
};

const deleteAnomaly = async (req, res) => {
  try {
    const anomaly = await Anomaly.findById(req.params.id);
    if (!anomaly) {
      return errorResponse(res, '异常记录不存在', 404);
    }

    await Anomaly.findByIdAndDelete(req.params.id);

    await logOperation({
      user: req.user,
      store: anomaly.store,
      module: 'anomaly',
      action: 'delete',
      targetType: 'Anomaly',
      targetId: req.params.id,
      description: `删除异常: ${anomaly.title}`,
      req,
      status: 'success'
    });

    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, error.message || '删除失败', 500);
  }
};

module.exports = {
  getAnomalyList,
  getAnomalyById,
  createAnomaly,
  updateAnomaly,
  resolveAnomaly,
  deleteAnomaly
};
