const Inventory = require('../models/Inventory');
const { successResponse, errorResponse, paginationQuery } = require('../utils/response');
const { logOperation, getFieldChanges } = require('../services/operationLogService');

const KEY_FIELDS = ['quantity', 'minStock', 'maxStock', 'status', 'unitPrice', 'expiryDate'];

const getInventoryList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, storeId, category, status, keyword } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

    const query = {};
    if (storeId) query.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }
    if (category) query.category = category;
    if (status) query.status = status;
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { sku: { $regex: keyword, $options: 'i' } }
      ];
    }

    const list = await Inventory.find(query)
      .populate('store createdBy')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Inventory.countDocuments(query);

    successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id).populate('store createdBy');
    if (!inventory) {
      return errorResponse(res, '库存记录不存在', 404);
    }
    successResponse(res, { inventory });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const createInventory = async (req, res) => {
  try {
    const { store, name, sku, category, unit, quantity, unitPrice, minStock, maxStock, expiryDate, location, notes } = req.body;

    if (!store || !name) {
      return errorResponse(res, '门店和名称不能为空');
    }

    const inventory = new Inventory({
      store,
      name,
      sku,
      category: category || 'other',
      unit: unit || '份',
      quantity: quantity || 0,
      unitPrice: unitPrice || 0,
      minStock: minStock || 10,
      maxStock: maxStock || 100,
      expiryDate,
      location,
      notes,
      createdBy: req.user._id,
      lastRestockedAt: quantity > 0 ? new Date() : null
    });

    await inventory.save();
    await inventory.populate('store createdBy');

    await logOperation({
      user: req.user,
      store: store,
      module: 'inventory',
      action: 'create',
      targetType: 'Inventory',
      targetId: inventory._id,
      description: `新增库存: ${name}`,
      req,
      status: 'success'
    });

    successResponse(res, { inventory }, '创建成功');
  } catch (error) {
    errorResponse(res, error.message || '创建失败', 500);
  }
};

const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const oldInventory = await Inventory.findById(id);
    if (!oldInventory) {
      return errorResponse(res, '库存记录不存在', 404);
    }

    const updates = req.body;
    const updatedInventory = await Inventory.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('store createdBy');

    const fieldChanges = getFieldChanges(oldInventory.toObject(), updates, KEY_FIELDS);
    
    await logOperation({
      user: req.user,
      store: updatedInventory.store,
      module: 'inventory',
      action: 'update',
      targetType: 'Inventory',
      targetId: updatedInventory._id,
      description: `更新库存: ${updatedInventory.name}`,
      fieldChanges,
      req,
      status: 'success'
    });

    successResponse(res, { inventory: updatedInventory }, '更新成功');
  } catch (error) {
    errorResponse(res, error.message || '更新失败', 500);
  }
};

const restockInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, note } = req.body;
    const inventory = await Inventory.findById(id);
    
    if (!inventory) {
      return errorResponse(res, '库存记录不存在', 404);
    }

    const oldQuantity = inventory.quantity;
    inventory.quantity += parseFloat(quantity) || 0;
    inventory.lastRestockedAt = new Date();
    if (note) inventory.notes = (inventory.notes || '') + '\n补货备注: ' + note;

    await inventory.save();
    await inventory.populate('store createdBy');

    await logOperation({
      user: req.user,
      store: inventory.store,
      module: 'inventory',
      action: 'restock',
      targetType: 'Inventory',
      targetId: inventory._id,
      description: `补货: ${inventory.name} (+${quantity})`,
      fieldChanges: [{ field: 'quantity', oldValue: oldQuantity, newValue: inventory.quantity }],
      req,
      status: 'success'
    });

    successResponse(res, { inventory }, '补货成功');
  } catch (error) {
    errorResponse(res, error.message || '操作失败', 500);
  }
};

const consumeInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, note } = req.body;
    const inventory = await Inventory.findById(id);
    
    if (!inventory) {
      return errorResponse(res, '库存记录不存在', 404);
    }
    if (inventory.quantity < quantity) {
      return errorResponse(res, '库存不足');
    }

    const oldQuantity = inventory.quantity;
    inventory.quantity -= parseFloat(quantity) || 0;
    inventory.lastCheckedAt = new Date();
    if (note) inventory.notes = (inventory.notes || '') + '\n消耗备注: ' + note;

    await inventory.save();
    await inventory.populate('store createdBy');

    await logOperation({
      user: req.user,
      store: inventory.store,
      module: 'inventory',
      action: 'consume',
      targetType: 'Inventory',
      targetId: inventory._id,
      description: `消耗库存: ${inventory.name} (-${quantity})`,
      fieldChanges: [{ field: 'quantity', oldValue: oldQuantity, newValue: inventory.quantity }],
      req,
      status: 'success'
    });

    successResponse(res, { inventory }, '操作成功');
  } catch (error) {
    errorResponse(res, error.message || '操作失败', 500);
  }
};

const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return errorResponse(res, '库存记录不存在', 404);
    }

    await Inventory.findByIdAndDelete(req.params.id);

    await logOperation({
      user: req.user,
      store: inventory.store,
      module: 'inventory',
      action: 'delete',
      targetType: 'Inventory',
      targetId: req.params.id,
      description: `删除库存: ${inventory.name}`,
      req,
      status: 'success'
    });

    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, error.message || '删除失败', 500);
  }
};

const getLowStockItems = async (req, res) => {
  try {
    const { storeId } = req.query;
    const query = { status: { $in: ['low', 'out_of_stock'] } };
    if (storeId) query.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }

    const items = await Inventory.find(query).populate('store');
    successResponse(res, { items }, '获取成功');
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

module.exports = {
  getInventoryList,
  getInventoryById,
  createInventory,
  updateInventory,
  restockInventory,
  consumeInventory,
  deleteInventory,
  getLowStockItems
};
