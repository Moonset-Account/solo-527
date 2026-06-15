import { Router } from 'express';
import mongoose from 'mongoose';
import WorkOrder from '../models/WorkOrder.js';
import Batch from '../models/Batch.js';
import Material from '../models/Material.js';
import Inspection from '../models/Inspection.js';
import Schedule from '../models/Schedule.js';
import { protect, requireRole } from '../middleware/auth.js';
import { writeLog, diffKeyFields, updateOrderRiskFlags } from '../utils/logger.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res) => {
  const { status, priority, keyword, page = 1, limit = 20 } = req.query;
  const q = {};
  if (status) q.status = status;
  if (priority) q.priority = priority;
  if (keyword) {
    q.$or = [
      { orderNo: { $regex: keyword, $options: 'i' } },
      { productName: { $regex: keyword, $options: 'i' } },
      { customer: { $regex: keyword, $options: 'i' } }
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [list, total] = await Promise.all([
    WorkOrder.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('ownerId', 'name username').lean(),
    WorkOrder.countDocuments(q)
  ]);
  res.json({ list, total, page: Number(page), limit: Number(limit) });
});

router.get('/:id', async (req, res) => {
  const order = await WorkOrder.findById(req.params.id).populate('ownerId', 'name username').lean();
  if (!order) return res.status(404).json({ error: '工单不存在' });
  const [batches, materials, inspections, schedules] = await Promise.all([
    Batch.find({ workOrderId: order._id }).populate('responsibleId', 'name').populate('assistantIds', 'name').lean(),
    Material.findOne({ workOrderId: order._id }).populate('preparedBy', 'name').lean(),
    Inspection.find({ workOrderId: order._id }).populate('inspectorId', 'name').sort({ createdAt: -1 }).lean(),
    Schedule.find({ workOrderId: order._id }).populate('operatorId', 'name').sort({ plannedDate: 1 }).lean()
  ]);
  res.json({ order, batches, materials, inspections, schedules });
});

router.post('/', requireRole('admin', 'planner'), async (req, res) => {
  const last = await WorkOrder.findOne().sort({ createdAt: -1 });
  const seq = last ? Number(last.orderNo.split('-')[1] || 0) + 1 : 1001;
  const order = new WorkOrder({
    ...req.body,
    orderNo: req.body.orderNo || `WO-${seq}`,
    ownerId: req.body.ownerId || req.user._id
  });
  await order.save();
  await updateOrderRiskFlags(order._id);
  await writeLog({
    action: '创建工单', category: 'status_change',
    userId: req.user._id, username: req.user.username, userRole: req.user.role,
    targetModel: 'WorkOrder', targetId: order._id, targetNo: order.orderNo,
    detail: `创建工单 ${order.orderNo} - ${order.productName}`, ip: req.ip
  });
  res.status(201).json(order);
});

router.put('/:id', requireRole('admin', 'planner'), async (req, res) => {
  const order = await WorkOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ error: '工单不存在' });
  const oldDoc = order.toObject();

  const wasDown = order.equipmentDown;
  const newData = req.body;

  Object.keys(newData).forEach(k => {
    if (k in order) order[k] = newData[k];
  });

  if (newData.status === 'in_production' && !order.actualStartDate) {
    order.actualStartDate = new Date();
  }
  if (newData.status === 'completed' && !order.actualEndDate) {
    order.actualEndDate = new Date();
  }

  await order.save();
  await updateOrderRiskFlags(order._id);

  const changes = diffKeyFields(oldDoc, order);
  if (changes.length > 0) {
    await writeLog({
      action: '关键字段修改', category: 'key_field_change',
      userId: req.user._id, username: req.user.username, userRole: req.user.role,
      targetModel: 'WorkOrder', targetId: order._id, targetNo: order.orderNo,
      fieldChanges: changes,
      detail: `工单 ${order.orderNo} 关键字段修改: ${changes.map(c => c.field).join(',')}`,
      ip: req.ip
    });
  }

  if (newData.status && newData.status !== oldDoc.status) {
    await writeLog({
      action: '状态变更', category: 'status_change',
      userId: req.user._id, username: req.user.username, userRole: req.user.role,
      targetModel: 'WorkOrder', targetId: order._id, targetNo: order.orderNo,
      fieldChanges: [{ field: 'status', oldValue: oldDoc.status, newValue: newData.status }],
      detail: `工单 ${order.orderNo} 状态: ${oldDoc.status} → ${newData.status}`,
      ip: req.ip
    });
  }

  if (typeof newData.equipmentDown === 'boolean' && newData.equipmentDown !== wasDown) {
    await writeLog({
      action: newData.equipmentDown ? '设备停机记录' : '设备恢复生产',
      category: 'equipment_down',
      userId: req.user._id, username: req.user.username, userRole: req.user.role,
      targetModel: 'WorkOrder', targetId: order._id, targetNo: order.orderNo,
      fieldChanges: [{ field: 'equipmentDown', oldValue: wasDown, newValue: newData.equipmentDown }],
      detail: `工单 ${order.orderNo} 设备[${order.equipmentId || '-'}] ${newData.equipmentDown ? '停机' : '恢复生产'}，备注: ${newData.remark || oldDoc.remark || ''}`,
      ip: req.ip
    });
  }

  res.json(order);
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const order = await WorkOrder.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ error: '工单不存在' });
  await writeLog({
    action: '删除工单', category: 'status_change',
    userId: req.user._id, username: req.user.username, userRole: req.user.role,
    targetModel: 'WorkOrder', targetId: order._id, targetNo: order.orderNo,
    detail: `删除工单 ${order.orderNo}`, ip: req.ip
  });
  res.json({ ok: true });
});

router.post('/:id/daily', requireRole('admin', 'planner'), async (req, res) => {
  const { producedQty, workHours, remark } = req.body;
  const order = await WorkOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ error: '工单不存在' });
  if (producedQty != null) order.producedQty = Math.max(0, Number(producedQty) || 0);
  if (workHours != null) order.workHours = Math.max(0, Number(workHours) || 0);
  if (remark !== undefined) order.remark = remark;
  await order.save();
  await updateOrderRiskFlags(order._id);
  res.json(order);
});

export default router;
