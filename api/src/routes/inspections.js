import { Router } from 'express';
import Inspection from '../models/Inspection.js';
import WorkOrder from '../models/WorkOrder.js';
import { protect, requireRole } from '../middleware/auth.js';
import { writeLog, updateOrderRiskFlags } from '../utils/logger.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res) => {
  const { workOrderId, batchId, page = 1, limit = 50 } = req.query;
  const q = {};
  if (workOrderId) q.workOrderId = workOrderId;
  if (batchId) q.batchId = batchId;
  const skip = (Number(page) - 1) * Number(limit);
  const [list, total] = await Promise.all([
    Inspection.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('inspectorId', 'name').lean(),
    Inspection.countDocuments(q)
  ]);
  res.json({ list, total });
});

router.post('/', requireRole('admin', 'planner'), async (req, res) => {
  const { workOrderId, batchId, sampleSize, passQty, failQty, defectItems = [], result, conclusion } = req.body;
  const order = await WorkOrder.findById(workOrderId);
  if (!order) return res.status(400).json({ error: '关联工单不存在' });
  const insp = new Inspection({
    workOrderId, batchId,
    inspectorId: req.user._id,
    inspectDate: new Date(),
    sampleSize: Number(sampleSize) || 0,
    passQty: Number(passQty) || 0,
    failQty: Number(failQty) || 0,
    defectItems,
    result: result || 'pending',
    conclusion
  });
  await insp.save();
  const rate = insp.sampleSize > 0 ? Math.round((insp.passQty / insp.sampleSize) * 10000) / 100 : 0;
  order.qualityPassRate = Math.max(order.qualityPassRate || 0, rate);
  await order.save();
  await updateOrderRiskFlags(order._id);
  await writeLog({
    action: '录入质检结果', category: 'status_change',
    userId: req.user._id, username: req.user.username, userRole: req.user.role,
    targetModel: 'Inspection', targetId: insp._id, targetNo: order.orderNo,
    detail: `工单 ${order.orderNo} 质检：${insp.sampleSize}件，合格率${rate}%，结果：${insp.result}`, ip: req.ip
  });
  res.status(201).json(insp);
});

router.put('/:id', requireRole('admin', 'planner'), async (req, res) => {
  const insp = await Inspection.findById(req.params.id);
  if (!insp) return res.status(404).json({ error: '质检记录不存在' });
  Object.keys(req.body).forEach(k => {
    if (k in insp) insp[k] = req.body[k];
  });
  insp.sampleSize = Number(insp.sampleSize) || 0;
  insp.passQty = Number(insp.passQty) || 0;
  insp.failQty = Number(insp.failQty) || 0;
  await insp.save();
  const order = await WorkOrder.findById(insp.workOrderId);
  if (order) {
    const rate = insp.sampleSize > 0 ? Math.round((insp.passQty / insp.sampleSize) * 10000) / 100 : 0;
    order.qualityPassRate = Math.max(order.qualityPassRate || 0, rate);
    await order.save();
    await updateOrderRiskFlags(order._id);
  }
  res.json(insp);
});

export default router;
