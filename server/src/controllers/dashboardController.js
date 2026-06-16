const Store = require('../models/Store');
const User = require('../models/User');
const BusinessData = require('../models/BusinessData');
const Anomaly = require('../models/Anomaly');
const RectificationTask = require('../models/RectificationTask');
const Inventory = require('../models/Inventory');
const MemberCoupon = require('../models/MemberCoupon');
const CashDifference = require('../models/CashDifference');
const Reminder = require('../models/Reminder');
const InspectionTask = require('../models/InspectionTask');
const { successResponse, errorResponse } = require('../utils/response');
const { runAllRules } = require('../services/reminderRuleService');
const dayjs = require('dayjs');

const getDashboardStats = async (req, res) => {
  try {
    const { storeId } = req.query;
    const storeFilter = {};
    
    if (storeId) {
      storeFilter.store = storeId;
    }
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      storeFilter.store = req.user.store;
    }

    const today = dayjs().startOf('day');
    const monthStart = dayjs().startOf('month');

    const [
      storeCount,
      userCount,
      todayBusiness,
      monthSales,
      anomalyCount,
      pendingAnomalies,
      taskCount,
      pendingTasks,
      inventoryCount,
      lowStockCount,
      couponCount,
      activeCoupons,
      cashDiffCount,
      pendingCashDiff,
      reminderCount,
      unreadReminders,
      inspectionCount,
      pendingInspections
    ] = await Promise.all([
      Store.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'active' }),
      BusinessData.findOne({ ...storeFilter, date: today.toDate() }),
      BusinessData.aggregate([
        { $match: { ...storeFilter, date: { $gte: monthStart.toDate() } } },
        { $group: { _id: null, totalSales: { $sum: '$totalSales' }, totalProfit: { $sum: '$netProfit' } } }
      ]),
      Anomaly.countDocuments(storeFilter),
      Anomaly.countDocuments({ ...storeFilter, status: { $in: ['reported', 'in_progress'] } }),
      RectificationTask.countDocuments(storeFilter),
      RectificationTask.countDocuments({ ...storeFilter, status: { $in: ['pending', 'in_progress', 'submitted'] } }),
      Inventory.countDocuments(storeFilter),
      Inventory.countDocuments({ ...storeFilter, status: { $in: ['low', 'out_of_stock'] } }),
      MemberCoupon.countDocuments(storeFilter),
      MemberCoupon.countDocuments({ ...storeFilter, status: 'active' }),
      CashDifference.countDocuments(storeFilter),
      CashDifference.countDocuments({ ...storeFilter, handlingResult: 'pending' }),
      Reminder.countDocuments(storeFilter),
      Reminder.countDocuments({ ...storeFilter, status: 'pending' }),
      InspectionTask.countDocuments(storeFilter),
      InspectionTask.countDocuments({ ...storeFilter, status: { $in: ['scheduled', 'in_progress'] } })
    ]);

    const stats = {
      overview: {
        storeCount,
        userCount
      },
      business: {
        todaySales: todayBusiness?.totalSales || 0,
        todayProfit: todayBusiness?.netProfit || 0,
        monthSales: monthSales[0]?.totalSales || 0,
        monthProfit: monthSales[0]?.totalProfit || 0
      },
      anomaly: {
        total: anomalyCount,
        pending: pendingAnomalies
      },
      rectification: {
        total: taskCount,
        pending: pendingTasks
      },
      inventory: {
        total: inventoryCount,
        lowStock: lowStockCount
      },
      coupons: {
        total: couponCount,
        active: activeCoupons
      },
      cashDifference: {
        total: cashDiffCount,
        pending: pendingCashDiff
      },
      reminders: {
        total: reminderCount,
        unread: unreadReminders
      },
      inspections: {
        total: inspectionCount,
        pending: pendingInspections
      }
    };

    successResponse(res, { stats }, '获取成功');
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getRecentActivities = async (req, res) => {
  try {
    const { storeId, limit = 10 } = req.query;
    const storeFilter = {};
    
    if (storeId) storeFilter.store = storeId;
    if (req.user.role === 'store_manager' || req.user.role === 'staff') {
      storeFilter.store = req.user.store;
    }

    const OperationLog = require('../models/OperationLog');
    const activities = await OperationLog.find(storeFilter)
      .populate('user store')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    successResponse(res, { activities }, '获取成功');
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const runReminderRules = async (req, res) => {
  try {
    const { storeId } = req.query;
    const reminders = await runAllRules(storeId);
    successResponse(res, { count: reminders.length, reminders }, '催办规则执行完成');
  } catch (error) {
    errorResponse(res, error.message || '执行失败', 500);
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivities,
  runReminderRules
};
