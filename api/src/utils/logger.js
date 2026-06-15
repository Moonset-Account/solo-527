import AuditLog from '../models/AuditLog.js';
import WorkOrder from '../models/WorkOrder.js';

const KEY_FIELDS = ['status', 'plannedStartDate', 'plannedEndDate', 'priority', 'equipmentId', 'ownerId', 'quantity'];

export const writeLog = async ({
  action, category, userId, username, userRole,
  targetModel, targetId, targetNo, fieldChanges = [], detail = '', ip = ''
}) => {
  try {
    await AuditLog.create({
      action, category, userId, username, userRole,
      targetModel, targetId, targetNo, fieldChanges, detail, ip
    });
  } catch (e) {
    console.warn('[LOG写入失败]', e.message);
  }
};

export const diffKeyFields = (oldDoc, newDoc) => {
  const changes = [];
  for (const field of KEY_FIELDS) {
    const a = oldDoc[field];
    const b = newDoc[field];
    const as = a instanceof Date ? a.toISOString() : String(a ?? '');
    const bs = b instanceof Date ? b.toISOString() : String(b ?? '');
    if (as !== bs) {
      changes.push({ field, oldValue: a, newValue: b });
    }
  }
  return changes;
};

export const updateOrderRiskFlags = async (orderId) => {
  try {
    const order = await WorkOrder.findById(orderId);
    if (!order) return;
    const flags = [];
    const now = new Date();
    if (order.status !== 'completed' && order.status !== 'cancelled') {
      const daysLeft = Math.ceil((new Date(order.plannedEndDate) - now) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) flags.push('已逾期');
      else if (daysLeft <= 1) flags.push('交期紧张(1天内)');
      else if (daysLeft <= 3) flags.push('临近交期(3天内)');
    }
    if (order.materialStatus === 'not_ready') flags.push('物料未齐套');
    else if (order.materialStatus === 'partial') flags.push('物料部分齐套');
    if (order.equipmentDown) flags.push('设备停机');
    if (order.qualityPassRate > 0 && order.qualityPassRate < 90) flags.push('合格率偏低(<90%)');
    order.riskFlags = flags;
    await order.save();
  } catch (e) {
    console.warn('[风险标识更新失败]', e.message);
  }
};
