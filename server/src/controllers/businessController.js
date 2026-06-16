const BusinessData = require('../models/BusinessData');
const { successResponse, errorResponse, paginationQuery } = require('../utils/response');
const { logOperation, getFieldChanges } = require('../services/operationLogService');
const dayjs = require('dayjs');

const KEY_FIELDS = ['totalSales', 'orderCount', 'costOfGoods', 'laborCost', 'rentCost', 'utilityCost', 'otherCost'];

const getBusinessDataList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, storeId, startDate, endDate } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

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

    const list = await BusinessData.find(query)
      .populate('store createdBy')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });
    
    const total = await BusinessData.countDocuments(query);

    successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getBusinessDataById = async (req, res) => {
  try {
    const data = await BusinessData.findById(req.params.id).populate('store createdBy');
    if (!data) {
      return errorResponse(res, '数据不存在', 404);
    }
    successResponse(res, { data });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const createBusinessData = async (req, res) => {
  try {
    const { store, date, totalSales, orderCount, memberSales, takeoutSales, dineInSales, costOfGoods, laborCost, rentCost, utilityCost, otherCost, weather, notes } = req.body;

    if (!store || !date) {
      return errorResponse(res, '门店和日期不能为空');
    }

    const existing = await BusinessData.findOne({ store, date: new Date(date) });
    if (existing) {
      return errorResponse(res, '该日期的营业数据已存在');
    }

    const businessData = new BusinessData({
      store,
      date,
      totalSales: totalSales || 0,
      orderCount: orderCount || 0,
      memberSales: memberSales || 0,
      takeoutSales: takeoutSales || 0,
      dineInSales: dineInSales || 0,
      costOfGoods: costOfGoods || 0,
      laborCost: laborCost || 0,
      rentCost: rentCost || 0,
      utilityCost: utilityCost || 0,
      otherCost: otherCost || 0,
      weather,
      notes,
      createdBy: req.user._id
    });

    await businessData.save();
    await businessData.populate('store createdBy');

    await logOperation({
      user: req.user,
      store: store,
      module: 'business',
      action: 'create',
      targetType: 'BusinessData',
      targetId: businessData._id,
      description: `录入营业数据: ${dayjs(date).format('YYYY-MM-DD')}`,
      req,
      status: 'success'
    });

    successResponse(res, { data: businessData }, '创建成功');
  } catch (error) {
    errorResponse(res, error.message || '创建失败', 500);
  }
};

const updateBusinessData = async (req, res) => {
  try {
    const { id } = req.params;
    const oldData = await BusinessData.findById(id);
    if (!oldData) {
      return errorResponse(res, '数据不存在', 404);
    }

    const updates = req.body;
    const updatedData = await BusinessData.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('store createdBy');

    const fieldChanges = getFieldChanges(oldData.toObject(), updates, KEY_FIELDS);
    
    await logOperation({
      user: req.user,
      store: updatedData.store,
      module: 'business',
      action: 'update',
      targetType: 'BusinessData',
      targetId: updatedData._id,
      description: `更新营业数据: ${dayjs(updatedData.date).format('YYYY-MM-DD')}`,
      fieldChanges,
      req,
      status: 'success'
    });

    successResponse(res, { data: updatedData }, '更新成功');
  } catch (error) {
    errorResponse(res, error.message || '更新失败', 500);
  }
};

const deleteBusinessData = async (req, res) => {
  try {
    const data = await BusinessData.findById(req.params.id);
    if (!data) {
      return errorResponse(res, '数据不存在', 404);
    }

    await BusinessData.findByIdAndDelete(req.params.id);

    await logOperation({
      user: req.user,
      store: data.store,
      module: 'business',
      action: 'delete',
      targetType: 'BusinessData',
      targetId: req.params.id,
      description: `删除营业数据: ${dayjs(data.date).format('YYYY-MM-DD')}`,
      req,
      status: 'success'
    });

    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, error.message || '删除失败', 500);
  }
};

const getProfitStatistics = async (req, res) => {
  try {
    const { storeId, startDate, endDate, period = 'month' } = req.query;

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

    const dataList = await BusinessData.find(query).sort({ date: 1 });

    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalOrders = 0;

    const dailyData = dataList.map(item => {
      totalSales += item.totalSales;
      totalCost += item.costOfGoods + item.laborCost + item.rentCost + item.utilityCost + item.otherCost;
      totalProfit += item.netProfit;
      totalOrders += item.orderCount;
      return {
        date: dayjs(item.date).format('YYYY-MM-DD'),
        sales: item.totalSales,
        profit: item.netProfit,
        margin: item.profitMargin
      };
    });

    successResponse(res, {
      totalSales,
      totalCost,
      totalProfit,
      totalOrders,
      avgProfitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
      dailyData,
      period
    }, '获取成功');
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

module.exports = {
  getBusinessDataList,
  getBusinessDataById,
  createBusinessData,
  updateBusinessData,
  deleteBusinessData,
  getProfitStatistics
};
