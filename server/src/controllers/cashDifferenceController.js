const CashDifference = require('../models/CashDifference');
const { successResponse, errorResponse, paginationQuery } = require('../utils/response');
const { logOperation, getFieldChanges } = require('../services/operationLogService');
const dayjs = require('dayjs');

const KEY_FIELDS = ['expectedCash', 'actualCash', 'difference', 'handlingResult', 'impactOnProfit'];

const getCashDifferenceList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, storeId, shift, handlingResult, startDate, endDate } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

    const query = {};
    if (storeId) query.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }
    if (shift) query.shift = shift;
    if (handlingResult) query.handlingResult = handlingResult;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const list = await CashDifference.find(query)
      .populate('store recordedBy handledBy')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });
    
    const total = await CashDifference.countDocuments(query);

    successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getCashDifferenceById = async (req, res) => {
  try {
    const data = await CashDifference.findById(req.params.id).populate('store recordedBy handledBy');
    if (!data) {
      return errorResponse(res, '记录不存在', 404);
    }
    successResponse(res, { data });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const createCashDifference = async (req, res) => {
  try {
    const { store, date, shift, expectedCash, actualCash, reason, note } = req.body;

    if (!store || !date) {
      return errorResponse(res, '门店和日期不能为空');
    }

    const existing = await CashDifference.findOne({ store, date: new Date(date), shift: shift || 'all_day' });
    if (existing) {
      return errorResponse(res, '该班次的现金差异记录已存在');
    }

    const data = new CashDifference({
      store,
      date,
      shift: shift || 'all_day',
      expectedCash: expectedCash || 0,
      actualCash: actualCash || 0,
      reason: reason || 'other',
      note,
      recordedBy: req.user._id
    });

    await data.save();
    await data.populate('store recordedBy');

    await logOperation({
      user: req.user,
      store: store,
      module: 'cash_difference',
      action: 'create',
      targetType: 'CashDifference',
      targetId: data._id,
      description: `录入现金差异: ${dayjs(date).format('YYYY-MM-DD')} ${shift}`,
      req,
      status: 'success'
    });

    successResponse(res, { data }, '创建成功');
  } catch (error) {
    errorResponse(res, error.message || '创建失败', 500);
  }
};

const updateCashDifference = async (req, res) => {
  try {
    const { id } = req.params;
    const oldData = await CashDifference.findById(id);
    if (!oldData) {
      return errorResponse(res, '记录不存在', 404);
    }

    const updates = req.body;
    const updatedData = await CashDifference.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('store recordedBy handledBy');

    const fieldChanges = getFieldChanges(oldData.toObject(), updates, KEY_FIELDS);
    
    await logOperation({
      user: req.user,
      store: updatedData.store,
      module: 'cash_difference',
      action: 'update',
      targetType: 'CashDifference',
      targetId: updatedData._id,
      description: `更新现金差异记录`,
      fieldChanges,
      req,
      status: 'success'
    });

    successResponse(res, { data: updatedData }, '更新成功');
  } catch (error) {
    errorResponse(res, error.message || '更新失败', 500);
  }
};

const handleCashDifference = async (req, res) => {
  try {
    const { id } = req.params;
    const { handlingResult, handlingNote, impactOnProfit } = req.body;
    const data = await CashDifference.findById(id);
    
    if (!data) {
      return errorResponse(res, '记录不存在', 404);
    }

    const oldResult = data.handlingResult;
    const oldImpact = data.impactOnProfit;
    data.handlingResult = handlingResult || 'adjusted';
    data.handlingNote = handlingNote;
    data.handledBy = req.user._id;
    data.handledAt = new Date();
    if (impactOnProfit !== undefined) data.impactOnProfit = impactOnProfit;

    await data.save();
    await data.populate('store recordedBy handledBy');

    await logOperation({
      user: req.user,
      store: data.store,
      module: 'cash_difference',
      action: 'handle',
      targetType: 'CashDifference',
      targetId: data._id,
      description: `处理现金差异`,
      fieldChanges: [
        { field: 'handlingResult', oldValue: oldResult, newValue: data.handlingResult },
        { field: 'impactOnProfit', oldValue: oldImpact, newValue: data.impactOnProfit }
      ],
      req,
      status: 'success'
    });

    successResponse(res, { data }, '处理成功');
  } catch (error) {
    errorResponse(res, error.message || '处理失败', 500);
  }
};

const deleteCashDifference = async (req, res) => {
  try {
    const data = await CashDifference.findById(req.params.id);
    if (!data) {
      return errorResponse(res, '记录不存在', 404);
    }

    await CashDifference.findByIdAndDelete(req.params.id);

    await logOperation({
      user: req.user,
      store: data.store,
      module: 'cash_difference',
      action: 'delete',
      targetType: 'CashDifference',
      targetId: req.params.id,
      description: `删除现金差异记录`,
      req,
      status: 'success'
    });

    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, error.message || '删除失败', 500);
  }
};

const getCashStatistics = async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    const query = {};
    if (storeId) query.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const dataList = await CashDifference.find(query);
    let totalExpected = 0;
    let totalActual = 0;
    let totalDiff = 0;
    let overCount = 0;
    let shortCount = 0;
    let pendingCount = 0;

    dataList.forEach(item => {
      totalExpected += item.expectedCash;
      totalActual += item.actualCash;
      totalDiff += item.difference;
      if (item.difference > 0) overCount++;
      if (item.difference < 0) shortCount++;
      if (item.handlingResult === 'pending') pendingCount++;
    });

    successResponse(res, {
      totalExpected,
      totalActual,
      totalDiff,
      overCount,
      shortCount,
      pendingCount,
      totalRecords: dataList.length
    }, '获取成功');
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

module.exports = {
  getCashDifferenceList,
  getCashDifferenceById,
  createCashDifference,
  updateCashDifference,
  handleCashDifference,
  deleteCashDifference,
  getCashStatistics
};
