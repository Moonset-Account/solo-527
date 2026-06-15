import { Router } from 'express';
import Batch from '../models/Batch.js';
import WorkOrder from '../models/WorkOrder.js';
import { protect, requireRole } from '../middleware/auth.js';
import { writeLog, updateOrderRiskFlags } from '../utils/logger.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res) => {
  const { workOrderId, keyword, page = 1, limit = 50 } = req.query;
  const q = {};
  if (workOrderId) q.workOrderId = workOrderId;
  if (keyword) {
    q.$or = [
      { batchNo: { $regex: keyword, $options: 'i' } },
      { productName: { $regex: keyword, $options: 'i' } }
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [list, total] = await Promise.all([
    Batch.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('responsibleId', 'name').populate('assistantIds', 'name').populate('workOrderId', 'orderNo').lean(),
    Batch.countDocuments(q)
  ]);
  res.json({ list, total });
});

router.get('/:id', async (req, res) => {
  const batch = await Batch.findById(req.params.id)
    .populate('responsibleId', 'name').populate('assistantIds', 'name').populate('workOrderId', 'orderNo productName').lean();
  if (!batch) return res.status(404).json({ error: '批次不存在' });
  res.json(batch);
});

router.post('/', requireRole('admin', 'planner'), async (req, res) => {
  const { workOrderId } = req.body;
  const order = await WorkOrder.findById(workOrderId);
  if (!order) return res.status(400).json({ error: '关联工单不存在' });
  const last = await Batch.findOne({ workOrderId }).sort({ createdAt: -1 });
  const idx = last ? Number((last.batchNo.match(/-B(\d+)$/) || [])[1] || 0) + 1 : 1;
  const batch = new Batch({
    ...req.body,
    batchNo: req.body.batchNo || `${order.orderNo}-B${String(idx).padStart(2, '0')}`,
    productName: order.productName
  });
  await batch.save();
  await writeLog({
    action: '创建批次', category: 'batch',
    userId: req.user._id, username: req.user.username, userRole: req.user.role,
    targetModel: 'Batch', targetId: batch._id, targetNo: batch.batchNo,
    detail: `创建追溯批次 ${batch.batchNo}，数量 ${batch.quantity}`, ip: req.ip
  });
  res.status(201).json(batch);
});

router.put('/:id', requireRole('admin', 'planner'), async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  if (!batch) return res.status(404).json({ error: '批次不存在' });
  const old = batch.toObject();
  Object.keys(req.body).forEach(k => {
    if (k in batch) batch[k] = req.body[k];
  });
  await batch.save();
  const changed = [];
  ['responsibleId', 'status', 'quantity', 'productionLine'].forEach(f => {
    const a = String(old[f] ?? '');
    const b = String(batch[f] ?? '');
    if (a !== b) changed.push({ field: f, oldValue: old[f], newValue: batch[f] });
  });
  if (changed.length) {
    await writeLog({
      action: '关键字段修改', category: 'key_field_change',
      userId: req.user._id, username: req.user.username, userRole: req.user.role,
      targetModel: 'Batch', targetId: batch._id, targetNo: batch.batchNo,
      fieldChanges: changed, detail: `批次 ${batch.batchNo} 字段修改`, ip: req.ip
    });
  }
  res.json(batch);
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const batch = await Batch.findByIdAndDelete(req.params.id);
  if (!batch) return res.status(404).json({ error: '批次不存在' });
  await writeLog({
    action: '删除批次', category: 'batch',
    userId: req.user._id, username: req.user.username, userRole: req.user.role,
    targetModel: 'Batch', targetId: batch._id, targetNo: batch.batchNo,
    detail: `删除追溯批次 ${batch.batchNo}`, ip: req.ip
  });
  res.json({ ok: true });
});

export default router;
