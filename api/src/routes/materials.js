import { Router } from 'express';
import Material from '../models/Material.js';
import WorkOrder from '../models/WorkOrder.js';
import { protect, requireRole } from '../middleware/auth.js';
import { writeLog, updateOrderRiskFlags } from '../utils/logger.js';

const router = Router();
router.use(protect);

router.get('/workorder/:workOrderId', async (req, res) => {
  let mat = await Material.findOne({ workOrderId: req.params.workOrderId }).populate('preparedBy', 'name').lean();
  if (!mat) {
    mat = { workOrderId: req.params.workOrderId, items: [], overallStatus: 'not_ready', remark: '' };
  }
  res.json(mat);
});

router.post('/', requireRole('admin', 'planner'), async (req, res) => {
  const { workOrderId, items = [], remark = '', preparedBy } = req.body;
  const order = await WorkOrder.findById(workOrderId);
  if (!order) return res.status(400).json({ error: '关联工单不存在' });
  items.forEach(it => {
    const p = Number(it.preparedQty) || 0;
    const r = Number(it.requiredQty) || 0;
    it.status = p >= r ? 'ready' : p > 0 ? 'partial' : 'missing';
  });
  let overall = 'not_ready';
  if (items.length > 0) {
    if (items.every(i => i.status === 'ready')) overall = 'ready';
    else if (items.some(i => i.status === 'partial' || i.status === 'ready')) overall = 'partial';
  }
  let mat = await Material.findOne({ workOrderId });
  if (!mat) {
    mat = new Material({ workOrderId, items, overallStatus: overall, remark, preparedBy: preparedBy || req.user._id });
  } else {
    mat.items = items;
    mat.overallStatus = overall;
    mat.remark = remark;
    mat.preparedBy = preparedBy || req.user._id;
  }
  await mat.save();
  order.materialStatus = overall;
  await order.save();
  await updateOrderRiskFlags(order._id);
  await writeLog({
    action: '物料齐套更新', category: 'status_change',
    userId: req.user._id, username: req.user.username, userRole: req.user.role,
    targetModel: 'WorkOrder', targetId: order._id, targetNo: order.orderNo,
    detail: `工单 ${order.orderNo} 物料齐套状态: ${overall}`, ip: req.ip
  });
  res.json(mat);
});

export default router;
