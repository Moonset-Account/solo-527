const MemberCoupon = require('../models/MemberCoupon');
const { successResponse, errorResponse, paginationQuery } = require('../utils/response');
const { logOperation, getFieldChanges } = require('../services/operationLogService');

const KEY_FIELDS = ['status', 'totalCount', 'usedCount', 'validFrom', 'validTo', 'value', 'minSpend'];

const getCouponList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, storeId, type, status, keyword } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

    const query = {};
    if (storeId) query.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }
    if (type) query.type = type;
    if (status) query.status = status;
    if (keyword) query.name = { $regex: keyword, $options: 'i' };

    const list = await MemberCoupon.find(query)
      .populate('store createdBy')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await MemberCoupon.countDocuments(query);

    successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getCouponById = async (req, res) => {
  try {
    const coupon = await MemberCoupon.findById(req.params.id).populate('store createdBy');
    if (!coupon) {
      return errorResponse(res, '券包不存在', 404);
    }
    successResponse(res, { coupon });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const createCoupon = async (req, res) => {
  try {
    const { store, name, type, value, minSpend, totalCount, validFrom, validTo, description, distributionMethod, reminderDays, applicableProducts } = req.body;

    if (!store || !name) {
      return errorResponse(res, '门店和名称不能为空');
    }

    const coupon = new MemberCoupon({
      store,
      name,
      type: type || 'discount',
      value: value || 0,
      minSpend: minSpend || 0,
      totalCount: totalCount || 0,
      remainingCount: totalCount || 0,
      validFrom,
      validTo,
      description,
      distributionMethod: distributionMethod || 'manual',
      reminderDays: reminderDays || 3,
      applicableProducts: applicableProducts || [],
      createdBy: req.user._id
    });

    await coupon.save();
    await coupon.populate('store createdBy');

    await logOperation({
      user: req.user,
      store: store,
      module: 'member_coupon',
      action: 'create',
      targetType: 'MemberCoupon',
      targetId: coupon._id,
      description: `创建会员券包: ${name}`,
      req,
      status: 'success'
    });

    successResponse(res, { coupon }, '创建成功');
  } catch (error) {
    errorResponse(res, error.message || '创建失败', 500);
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const oldCoupon = await MemberCoupon.findById(id);
    if (!oldCoupon) {
      return errorResponse(res, '券包不存在', 404);
    }

    const updates = req.body;
    const updatedCoupon = await MemberCoupon.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('store createdBy');

    const fieldChanges = getFieldChanges(oldCoupon.toObject(), updates, KEY_FIELDS);
    
    await logOperation({
      user: req.user,
      store: updatedCoupon.store,
      module: 'member_coupon',
      action: 'update',
      targetType: 'MemberCoupon',
      targetId: updatedCoupon._id,
      description: `更新会员券包: ${updatedCoupon.name}`,
      fieldChanges,
      req,
      status: 'success'
    });

    successResponse(res, { coupon: updatedCoupon }, '更新成功');
  } catch (error) {
    errorResponse(res, error.message || '更新失败', 500);
  }
};

const useCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await MemberCoupon.findById(id);
    
    if (!coupon) {
      return errorResponse(res, '券包不存在', 404);
    }
    if (coupon.status !== 'active') {
      return errorResponse(res, '券包不可用');
    }
    if (coupon.remainingCount <= 0) {
      return errorResponse(res, '券包已用完');
    }

    const oldUsedCount = coupon.usedCount;
    const oldRemaining = coupon.remainingCount;
    coupon.usedCount += 1;
    coupon.remainingCount -= 1;

    await coupon.save();
    await coupon.populate('store createdBy');

    await logOperation({
      user: req.user,
      store: coupon.store,
      module: 'member_coupon',
      action: 'use',
      targetType: 'MemberCoupon',
      targetId: coupon._id,
      description: `使用券包: ${coupon.name}`,
      fieldChanges: [
        { field: 'usedCount', oldValue: oldUsedCount, newValue: coupon.usedCount },
        { field: 'remainingCount', oldValue: oldRemaining, newValue: coupon.remainingCount }
      ],
      req,
      status: 'success'
    });

    successResponse(res, { coupon }, '使用成功');
  } catch (error) {
    errorResponse(res, error.message || '操作失败', 500);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await MemberCoupon.findById(req.params.id);
    if (!coupon) {
      return errorResponse(res, '券包不存在', 404);
    }

    await MemberCoupon.findByIdAndDelete(req.params.id);

    await logOperation({
      user: req.user,
      store: coupon.store,
      module: 'member_coupon',
      action: 'delete',
      targetType: 'MemberCoupon',
      targetId: req.params.id,
      description: `删除会员券包: ${coupon.name}`,
      req,
      status: 'success'
    });

    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, error.message || '删除失败', 500);
  }
};

const getExpiringCoupons = async (req, res) => {
  try {
    const { storeId, days = 7 } = req.query;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const query = {
      status: 'active',
      validTo: { $gte: now, $lte: futureDate },
      remainingCount: { $gt: 0 }
    };
    if (storeId) query.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }

    const coupons = await MemberCoupon.find(query).populate('store');
    successResponse(res, { coupons }, '获取成功');
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

module.exports = {
  getCouponList,
  getCouponById,
  createCoupon,
  updateCoupon,
  useCoupon,
  deleteCoupon,
  getExpiringCoupons
};
