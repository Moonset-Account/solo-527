const Store = require('../models/Store');
const { successResponse, errorResponse, paginationQuery } = require('../utils/response');
const { logOperation, getFieldChanges } = require('../services/operationLogService');

const KEY_FIELDS = ['name', 'code', 'status', 'rentCost', 'utilityCost', 'laborCost', 'targetProfit'];

const getStores = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

    const query = {};
    if (status) query.status = status;
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } }
      ];
    }

    const stores = await Store.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await Store.countDocuments(query);

    successResponse(res, { list: stores, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return errorResponse(res, '门店不存在', 404);
    }
    successResponse(res, { store });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const createStore = async (req, res) => {
  try {
    const { name, code, address, phone, manager, rentCost, utilityCost, laborCost, targetProfit } = req.body;

    if (!name || !code) {
      return errorResponse(res, '门店名称和编号不能为空');
    }

    const existingStore = await Store.findOne({ code });
    if (existingStore) {
      return errorResponse(res, '门店编号已存在');
    }

    const store = new Store({
      name,
      code,
      address,
      phone,
      manager,
      rentCost: rentCost || 0,
      utilityCost: utilityCost || 0,
      laborCost: laborCost || 0,
      targetProfit: targetProfit || 0
    });

    await store.save();

    await logOperation({
      user: req.user,
      module: 'store',
      action: 'create',
      targetType: 'Store',
      targetId: store._id,
      description: `创建门店: ${name} (${code})`,
      req,
      status: 'success'
    });

    successResponse(res, { store }, '创建成功');
  } catch (error) {
    errorResponse(res, error.message || '创建失败', 500);
  }
};

const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const oldStore = await Store.findById(id);
    if (!oldStore) {
      return errorResponse(res, '门店不存在', 404);
    }

    const updates = req.body;
    const updatedStore = await Store.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    const fieldChanges = getFieldChanges(oldStore.toObject(), updates, KEY_FIELDS);
    
    await logOperation({
      user: req.user,
      store: updatedStore._id,
      module: 'store',
      action: 'update',
      targetType: 'Store',
      targetId: updatedStore._id,
      description: `更新门店信息: ${updatedStore.name}`,
      fieldChanges,
      req,
      status: 'success'
    });

    successResponse(res, { store: updatedStore }, '更新成功');
  } catch (error) {
    errorResponse(res, error.message || '更新失败', 500);
  }
};

const deleteStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return errorResponse(res, '门店不存在', 404);
    }

    await Store.findByIdAndDelete(req.params.id);

    await logOperation({
      user: req.user,
      module: 'store',
      action: 'delete',
      targetType: 'Store',
      targetId: req.params.id,
      description: `删除门店: ${store.name}`,
      req,
      status: 'success'
    });

    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, error.message || '删除失败', 500);
  }
};

module.exports = {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore
};
