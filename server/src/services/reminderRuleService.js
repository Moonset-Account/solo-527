const Inventory = require('../models/Inventory');
const RectificationTask = require('../models/RectificationTask');
const MemberCoupon = require('../models/MemberCoupon');
const InspectionTask = require('../models/InspectionTask');
const BusinessData = require('../models/BusinessData');
const Store = require('../models/Store');
const { createReminder } = require('../controllers/reminderController');
const dayjs = require('dayjs');

const RULES = {
  INVENTORY_LOW_STOCK: 'inventory_low_stock',
  INVENTORY_OUT_OF_STOCK: 'inventory_out_of_stock',
  INVENTORY_EXPIRED: 'inventory_expired',
  RECTIFICATION_OVERDUE: 'rectification_overdue',
  RECTIFICATION_PENDING: 'rectification_pending',
  COUPON_EXPIRING: 'coupon_expiring',
  COUPON_LOW_STOCK: 'coupon_low_stock',
  INSPECTION_DUE: 'inspection_due',
  INSPECTION_OVERDUE: 'inspection_overdue',
  PROFIT_BELOW_TARGET: 'profit_below_target',
  PROFIT_NEGATIVE: 'profit_negative',
  BUSINESS_NOT_REPORTED: 'business_not_reported'
};

const runInventoryRules = async (storeId) => {
  const query = {};
  if (storeId) query.store = storeId;

  const items = await Inventory.find(query);
  const reminders = [];

  for (const item of items) {
    if (item.status === 'out_of_stock') {
      const existing = await checkExistingReminder(item.store, 'inventory', RULES.INVENTORY_OUT_OF_STOCK, item._id);
      if (!existing) {
        const reminder = await createReminder(
          item.store,
          'inventory',
          'urgent',
          `库存缺货: ${item.name}`,
          `${item.name} 已缺货，请及时补货。当前库存: ${item.quantity} ${item.unit}`,
          {
            relatedId: item._id,
            relatedType: 'Inventory',
            ruleName: RULES.INVENTORY_OUT_OF_STOCK
          }
        );
        if (reminder) reminders.push(reminder);
      }
    } else if (item.status === 'low') {
      const existing = await checkExistingReminder(item.store, 'inventory', RULES.INVENTORY_LOW_STOCK, item._id);
      if (!existing) {
        const reminder = await createReminder(
          item.store,
          'inventory',
          'high',
          `库存不足: ${item.name}`,
          `${item.name} 库存低于安全库存。当前库存: ${item.quantity} ${item.unit}，安全库存: ${item.minStock} ${item.unit}`,
          {
            relatedId: item._id,
            relatedType: 'Inventory',
            ruleName: RULES.INVENTORY_LOW_STOCK
          }
        );
        if (reminder) reminders.push(reminder);
      }
    }

    if (item.expiryDate && dayjs(item.expiryDate).isBefore(dayjs())) {
      const existing = await checkExistingReminder(item.store, 'inventory', RULES.INVENTORY_EXPIRED, item._id);
      if (!existing) {
        const reminder = await createReminder(
          item.store,
          'inventory',
          'high',
          `食材过期: ${item.name}`,
          `${item.name} 已过期，过期日期: ${dayjs(item.expiryDate).format('YYYY-MM-DD')}`,
          {
            relatedId: item._id,
            relatedType: 'Inventory',
            ruleName: RULES.INVENTORY_EXPIRED
          }
        );
        if (reminder) reminders.push(reminder);
      }
    }
  }

  return reminders;
};

const runRectificationRules = async (storeId) => {
  const query = { status: { $in: ['pending', 'in_progress', 'submitted'] } };
  if (storeId) query.store = storeId;

  const tasks = await RectificationTask.find(query);
  const reminders = [];
  const now = dayjs();

  for (const task of tasks) {
    if (task.dueDate && now.isAfter(dayjs(task.dueDate))) {
      const existing = await checkExistingReminder(task.store, 'rectification', RULES.RECTIFICATION_OVERDUE, task._id);
      if (!existing) {
        const reminder = await createReminder(
          task.store,
          'rectification',
          'high',
          `整改任务逾期: ${task.title}`,
          `任务编号: ${task.taskNo}，截止日期: ${dayjs(task.dueDate).format('YYYY-MM-DD')}，状态: ${task.status}`,
          {
            relatedId: task._id,
            relatedType: 'RectificationTask',
            ruleName: RULES.RECTIFICATION_OVERDUE,
            dueDate: task.dueDate
          }
        );
        if (reminder) reminders.push(reminder);
      }
    }

    if (task.status === 'pending' && task.dueDate) {
      const daysUntilDue = dayjs(task.dueDate).diff(now, 'day');
      if (daysUntilDue <= 2 && daysUntilDue >= 0) {
        const existing = await checkExistingReminder(task.store, 'rectification', RULES.RECTIFICATION_PENDING, task._id);
        if (!existing) {
          const reminder = await createReminder(
            task.store,
            'rectification',
            'medium',
            `整改任务待处理: ${task.title}`,
            `任务编号: ${task.taskNo}，还有 ${daysUntilDue} 天到期`,
            {
              relatedId: task._id,
              relatedType: 'RectificationTask',
              ruleName: RULES.RECTIFICATION_PENDING,
              dueDate: task.dueDate
            }
          );
          if (reminder) reminders.push(reminder);
        }
      }
    }
  }

  return reminders;
};

const runCouponRules = async (storeId) => {
  const query = { status: 'active', remainingCount: { $gt: 0 } };
  if (storeId) query.store = storeId;

  const coupons = await MemberCoupon.find(query);
  const reminders = [];
  const now = dayjs();

  for (const coupon of coupons) {
    if (coupon.validTo) {
      const daysUntilExpiry = dayjs(coupon.validTo).diff(now, 'day');
      if (daysUntilExpiry <= coupon.reminderDays && daysUntilExpiry >= 0) {
        const existing = await checkExistingReminder(coupon.store, 'member_coupon', RULES.COUPON_EXPIRING, coupon._id);
        if (!existing) {
          const reminder = await createReminder(
            coupon.store,
            'member_coupon',
            'medium',
            `券包即将过期: ${coupon.name}`,
            `券包类型: ${coupon.type}，剩余 ${coupon.remainingCount} 张，${daysUntilExpiry} 天后过期`,
            {
              relatedId: coupon._id,
              relatedType: 'MemberCoupon',
              ruleName: RULES.COUPON_EXPIRING,
              dueDate: coupon.validTo
            }
          );
          if (reminder) reminders.push(reminder);
        }
      }
    }

    const usageRate = coupon.totalCount > 0 ? coupon.usedCount / coupon.totalCount : 0;
    if (usageRate > 0.8 && coupon.remainingCount > 0) {
      const existing = await checkExistingReminder(coupon.store, 'member_coupon', RULES.COUPON_LOW_STOCK, coupon._id);
      if (!existing) {
        const reminder = await createReminder(
          coupon.store,
          'member_coupon',
          'low',
          `券包库存不足: ${coupon.name}`,
          `已使用 ${Math.round(usageRate * 100)}%，剩余 ${coupon.remainingCount} 张`,
          {
            relatedId: coupon._id,
            relatedType: 'MemberCoupon',
            ruleName: RULES.COUPON_LOW_STOCK
          }
        );
        if (reminder) reminders.push(reminder);
      }
    }
  }

  return reminders;
};

const runInspectionRules = async (storeId) => {
  const query = { status: { $in: ['scheduled', 'in_progress'] } };
  if (storeId) query.store = storeId;

  const tasks = await InspectionTask.find(query);
  const reminders = [];
  const now = dayjs();

  for (const task of tasks) {
    if (task.dueDate && now.isAfter(dayjs(task.dueDate))) {
      const existing = await checkExistingReminder(task.store, 'business', RULES.INSPECTION_OVERDUE, task._id);
      if (!existing) {
        const reminder = await createReminder(
          task.store,
          'business',
          'high',
          `巡店任务逾期: ${task.title}`,
          `任务编号: ${task.taskNo}，截止日期: ${dayjs(task.dueDate).format('YYYY-MM-DD')}`,
          {
            relatedId: task._id,
            relatedType: 'InspectionTask',
            ruleName: RULES.INSPECTION_OVERDUE,
            dueDate: task.dueDate
          }
        );
        if (reminder) reminders.push(reminder);
      }
    } else if (task.scheduledDate) {
      const daysUntilDue = dayjs(task.scheduledDate).diff(now, 'day');
      if (daysUntilDue <= task.reminderDays && daysUntilDue >= 0) {
        const existing = await checkExistingReminder(task.store, 'business', RULES.INSPECTION_DUE, task._id);
        if (!existing) {
          const reminder = await createReminder(
            task.store,
            'business',
            'medium',
            `巡店任务提醒: ${task.title}`,
            `任务编号: ${task.taskNo}，计划日期: ${dayjs(task.scheduledDate).format('YYYY-MM-DD')}`,
            {
              relatedId: task._id,
              relatedType: 'InspectionTask',
              ruleName: RULES.INSPECTION_DUE,
              dueDate: task.scheduledDate
            }
          );
          if (reminder) reminders.push(reminder);
        }
      }
    }
  }

  return reminders;
};

const runProfitRules = async (storeId) => {
  const stores = storeId ? await Store.find({ _id: storeId }) : await Store.find({ status: 'active' });
  const reminders = [];
  const today = dayjs();
  const firstDayOfMonth = today.startOf('month');

  for (const store of stores) {
    const businessData = await BusinessData.find({
      store: store._id,
      date: { $gte: firstDayOfMonth.toDate(), $lte: today.toDate() }
    });

    const totalProfit = businessData.reduce((sum, d) => sum + d.netProfit, 0);
    const avgProfit = businessData.length > 0 ? totalProfit / businessData.length : 0;
    const daysInMonth = today.daysInMonth();
    const projectedProfit = avgProfit * daysInMonth;

    if (totalProfit < 0) {
      const existing = await checkExistingReminder(store._id, 'profit', RULES.PROFIT_NEGATIVE, store._id);
      if (!existing) {
        const reminder = await createReminder(
          store._id,
          'profit',
          'urgent',
          `门店亏损: ${store.name}`,
          `本月累计净利润: ¥${totalProfit.toFixed(2)}，处于亏损状态`,
          {
            relatedId: store._id,
            relatedType: 'Store',
            ruleName: RULES.PROFIT_NEGATIVE
          }
        );
        if (reminder) reminders.push(reminder);
      }
    }

    if (store.targetProfit > 0 && projectedProfit < store.targetProfit * 0.8) {
      const existing = await checkExistingReminder(store._id, 'profit', RULES.PROFIT_BELOW_TARGET, store._id);
      if (!existing) {
        const reminder = await createReminder(
          store._id,
          'profit',
          'high',
          `利润未达标: ${store.name}`,
          `目标利润: ¥${store.targetProfit.toFixed(2)}，预计完成: ¥${projectedProfit.toFixed(2)}，完成率: ${Math.round(projectedProfit / store.targetProfit * 100)}%`,
          {
            relatedId: store._id,
            relatedType: 'Store',
            ruleName: RULES.PROFIT_BELOW_TARGET
          }
        );
        if (reminder) reminders.push(reminder);
      }
    }
  }

  return reminders;
};

const runBusinessReportRules = async (storeId) => {
  const stores = storeId ? await Store.find({ _id: storeId }) : await Store.find({ status: 'active' });
  const reminders = [];
  const yesterday = dayjs().subtract(1, 'day').startOf('day');

  for (const store of stores) {
    const hasReport = await BusinessData.findOne({
      store: store._id,
      date: yesterday.toDate()
    });

    if (!hasReport) {
      const existing = await checkExistingReminder(store._id, 'business', RULES.BUSINESS_NOT_REPORTED, store._id);
      if (!existing) {
        const reminder = await createReminder(
          store._id,
          'business',
          'medium',
          `营业数据未上报: ${store.name}`,
          `昨日(${yesterday.format('YYYY-MM-DD')})营业数据未上报，请及时补录`,
          {
            relatedId: store._id,
            relatedType: 'Store',
            ruleName: RULES.BUSINESS_NOT_REPORTED
          }
        );
        if (reminder) reminders.push(reminder);
      }
    }
  }

  return reminders;
};

const checkExistingReminder = async (store, type, ruleName, relatedId) => {
  const Reminder = require('../models/Reminder');
  return await Reminder.findOne({
    store,
    type,
    ruleName,
    relatedId,
    status: { $in: ['pending', 'read'] }
  });
};

const runAllRules = async (storeId) => {
  const results = await Promise.all([
    runInventoryRules(storeId),
    runRectificationRules(storeId),
    runCouponRules(storeId),
    runInspectionRules(storeId),
    runProfitRules(storeId),
    runBusinessReportRules(storeId)
  ]);

  return results.flat();
};

module.exports = {
  RULES,
  runInventoryRules,
  runRectificationRules,
  runCouponRules,
  runInspectionRules,
  runProfitRules,
  runBusinessReportRules,
  runAllRules
};
