const BusinessData = require('../models/BusinessData');
const Anomaly = require('../models/Anomaly');
const RectificationTask = require('../models/RectificationTask');
const CashDifference = require('../models/CashDifference');
const InspectionTask = require('../models/InspectionTask');
const Inventory = require('../models/Inventory');
const Store = require('../models/Store');
const dayjs = require('dayjs');

const calculateStoreProfit = async (storeId, startDate, endDate) => {
  const query = { store: storeId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const businessData = await BusinessData.find(query).sort({ date: 1 });
  const store = await Store.findById(storeId);

  const totalSales = businessData.reduce((sum, d) => sum + d.totalSales, 0);
  const totalCostOfGoods = businessData.reduce((sum, d) => sum + d.costOfGoods, 0);
  const totalLaborCost = businessData.reduce((sum, d) => sum + d.laborCost, 0);
  const totalRentCost = businessData.reduce((sum, d) => sum + d.rentCost, 0);
  const totalUtilityCost = businessData.reduce((sum, d) => sum + d.utilityCost, 0);
  const totalOtherCost = businessData.reduce((sum, d) => sum + d.otherCost, 0);
  const totalNetProfit = businessData.reduce((sum, d) => sum + d.netProfit, 0);

  const anomalies = await Anomaly.find({
    store: storeId,
    ...(startDate || endDate ? { reportedAt: query.date || {} } : {})
  });
  const totalAnomalyImpact = anomalies.reduce((sum, a) => sum + (a.impactOnProfit || 0), 0);

  const tasks = await RectificationTask.find({
    store: storeId,
    status: 'approved',
    ...(startDate || endDate ? { reviewedAt: query.date || {} } : {})
  });
  const totalTaskImpact = tasks.reduce((sum, t) => sum + (t.impactOnProfit || 0), 0);

  const cashDiffs = await CashDifference.find({
    store: storeId,
    handlingResult: { $in: ['written_off', 'adjusted'] },
    ...(startDate || endDate ? { date: query.date || {} } : {})
  });
  const totalCashImpact = cashDiffs.reduce((sum, c) => sum + (c.impactOnProfit || 0), 0);

  const inspections = await InspectionTask.find({
    store: storeId,
    status: 'completed',
    ...(startDate || endDate ? { completedAt: query.date || {} } : {})
  });
  const totalInspectionImpact = inspections.reduce((sum, i) => sum + (i.impactOnProfit || 0), 0);

  const adjustedProfit = totalNetProfit + totalAnomalyImpact + totalTaskImpact + totalCashImpact + totalInspectionImpact;

  const profitBreakdown = {
    totalSales,
    totalCostOfGoods,
    totalLaborCost,
    totalRentCost,
    totalUtilityCost,
    totalOtherCost,
    grossProfit: totalSales - totalCostOfGoods,
    operatingProfit: totalNetProfit,
    adjustments: {
      anomalyImpact: totalAnomalyImpact,
      taskImpact: totalTaskImpact,
      cashImpact: totalCashImpact,
      inspectionImpact: totalInspectionImpact,
      totalAdjustment: totalAnomalyImpact + totalTaskImpact + totalCashImpact + totalInspectionImpact
    },
    adjustedProfit,
    profitMargin: totalSales > 0 ? (adjustedProfit / totalSales) * 100 : 0
  };

  const dailyProfits = businessData.map(d => ({
    date: dayjs(d.date).format('YYYY-MM-DD'),
    sales: d.totalSales,
    cost: d.costOfGoods + d.laborCost + d.rentCost + d.utilityCost + d.otherCost,
    profit: d.netProfit,
    margin: d.profitMargin
  }));

  return {
    store: store ? { id: store._id, name: store.name, code: store.code, targetProfit: store.targetProfit } : null,
    period: { startDate, endDate },
    ...profitBreakdown,
    dailyProfits,
    anomalyCount: anomalies.length,
    taskCount: tasks.length,
    cashDiffCount: cashDiffs.length,
    inspectionCount: inspections.length
  };
};

const calculateStoreProfitWithDetails = async (storeId, startDate, endDate) => {
  const profit = await calculateStoreProfit(storeId, startDate, endDate);

  const anomalies = await Anomaly.find({
    store: storeId,
    ...(startDate || endDate ? { reportedAt: { $gte: startDate, $lte: endDate } } : {})
  }).sort({ reportedAt: -1 });

  const tasks = await RectificationTask.find({
    store: storeId,
    status: 'approved',
    ...(startDate || endDate ? { reviewedAt: { $gte: startDate, $lte: endDate } } : {})
  }).sort({ reviewedAt: -1 });

  const cashDiffs = await CashDifference.find({
    store: storeId,
    ...(startDate || endDate ? { date: { $gte: startDate, $lte: endDate } } : {})
  }).sort({ date: -1 });

  return {
    ...profit,
    details: {
      anomalies,
      rectificationTasks: tasks,
      cashDifferences: cashDiffs
    }
  };
};

module.exports = {
  calculateStoreProfit,
  calculateStoreProfitWithDetails
};
