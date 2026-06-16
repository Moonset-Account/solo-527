const OperationLog = require('../models/OperationLog');
const { successResponse, errorResponse, paginationQuery } = require('../utils/response');

const getLogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, module, action, storeId, userId, startDate, endDate, keyword } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

    const query = {};
    if (module) query.module = module;
    if (action) query.action = action;
    if (storeId) query.store = storeId;
    if (userId) query.user = userId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      query.store = req.user.store;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (keyword) {
      query.$or = [
        { description: { $regex: keyword, $options: 'i' } },
        { username: { $regex: keyword, $options: 'i' } }
      ];
    }

    const logs = await OperationLog.find(query)
      .populate('user store')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await OperationLog.countDocuments(query);

    successResponse(res, { list: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getLogById = async (req, res) => {
  try {
    const log = await OperationLog.findById(req.params.id).populate('user store');
    if (!log) {
      return errorResponse(res, '日志不存在', 404);
    }
    successResponse(res, { log });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getModuleStats = async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    const match = {};
    if (storeId) match.store = new mongoose.Types.ObjectId(storeId);
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const stats = await OperationLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 },
          successCount: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      }
    ]);

    successResponse(res, { stats }, '获取成功');
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

module.exports = {
  getLogs,
  getLogById,
  getModuleStats
};
