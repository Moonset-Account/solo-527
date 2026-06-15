import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireAdmin);

router.get('/', async (req, res) => {
  const { category, userId, keyword, from, to, page = 1, limit = 50 } = req.query;
  const q = {};
  if (category) q.category = category;
  if (userId) q.userId = userId;
  if (from) q.timestamp = { ...q.timestamp, $gte: new Date(from) };
  if (to) q.timestamp = { ...q.timestamp, $lte: new Date(to) };
  if (keyword) {
    q.$or = [
      { action: { $regex: keyword, $options: 'i' } },
      { detail: { $regex: keyword, $options: 'i' } },
      { targetNo: { $regex: keyword, $options: 'i' } },
      { username: { $regex: keyword, $options: 'i' } }
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [list, total] = await Promise.all([
    AuditLog.find(q).sort({ timestamp: -1 }).skip(skip).limit(Number(limit)).lean(),
    AuditLog.countDocuments(q)
  ]);
  res.json({ list, total });
});

router.get('/stats', async (req, res) => {
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const stats = await AuditLog.aggregate([
    { $match: { timestamp: { $gte: last30 } } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  const byDay = await AuditLog.aggregate([
    { $match: { timestamp: { $gte: last30 } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      count: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]);
  res.json({ byCategory: stats, byDay });
});

export default router;
