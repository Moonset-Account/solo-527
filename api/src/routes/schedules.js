import { Router } from 'express';
import Schedule from '../models/Schedule.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res) => {
  const { from, to, productionLine, workOrderId } = req.query;
  const q = {};
  if (from) q.plannedDate = { ...q.plannedDate, $gte: new Date(from) };
  if (to) q.plannedDate = { ...q.plannedDate, $lte: new Date(to) };
  if (productionLine) q.productionLine = productionLine;
  if (workOrderId) q.workOrderId = workOrderId;
  const list = await Schedule.find(q).sort({ plannedDate: 1, shift: 1 })
    .populate('operatorId', 'name').populate('workOrderId', 'orderNo productName quantity status').lean();
  res.json({ list });
});

router.post('/', requireRole('admin', 'planner'), async (req, res) => {
  const s = new Schedule(req.body);
  await s.save();
  await s.populate('operatorId workOrderId');
  res.status(201).json(s);
});

router.put('/:id', requireRole('admin', 'planner'), async (req, res) => {
  const s = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('operatorId workOrderId');
  if (!s) return res.status(404).json({ error: '排期不存在' });
  res.json(s);
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const s = await Schedule.findByIdAndDelete(req.params.id);
  if (!s) return res.status(404).json({ error: '排期不存在' });
  res.json({ ok: true });
});

export default router;
