import express from 'express';
import Material from '../models/Material.js';
import Article from '../models/Article.js';
import Exception from '../models/Exception.js';
import Schedule from '../models/Schedule.js';
import { requireAuth } from '../middleware/auth.js';
import { redisClient } from '../config/redis.js';

const router = express.Router();

router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const cacheKey = 'stats:dashboard';
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const [
      totalMaterials,
      totalArticles,
      totalExceptions,
      pendingExceptions,
      materialTypeStats,
      materialAuthStats,
      articleStatusStats,
      exceptionTypeStats,
      exceptionStatusStats,
    ] = await Promise.all([
      Material.countDocuments(),
      Article.countDocuments(),
      Exception.countDocuments(),
      Exception.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      Material.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Material.aggregate([{ $group: { _id: '$authorization.status', count: { $sum: 1 } } }]),
      Article.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Exception.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Exception.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySchedules = await Schedule.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $project: {
          platform: 1,
          itemCount: { $size: '$items' },
        },
      },
    ]);

    const topReusedMaterials = await Material.find()
      .sort({ usageCount: -1 })
      .limit(10)
      .select('title type usageCount tags category')
      .lean();

    const result = {
      summary: {
        totalMaterials,
        totalArticles,
        totalExceptions,
        pendingExceptions,
      },
      materialStats: {
        byType: materialTypeStats.map(s => ({ type: s._id, count: s.count })),
        byAuthStatus: materialAuthStats.map(s => ({ status: s._id, count: s.count })),
        topReused: topReusedMaterials,
      },
      articleStats: {
        byStatus: articleStatusStats.map(s => ({ status: s._id, count: s.count })),
      },
      exceptionStats: {
        byType: exceptionTypeStats.map(s => ({ type: s._id, count: s.count })),
        byStatus: exceptionStatusStats.map(s => ({ status: s._id, count: s.count })),
      },
      todaySchedules,
    };

    await redisClient.setEx(cacheKey, 60, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/materials/reuse', requireAuth, async (req, res, next) => {
  try {
    const { period = 'month', limit = 20 } = req.query;

    const topReused = await Material.find()
      .sort({ usageCount: -1 })
      .limit(Number(limit))
      .select('title type tags usageCount category fileUrl thumbnail createdAt')
      .lean();

    const totalCount = await Material.countDocuments();
    const reusedCount = await Material.countDocuments({ usageCount: { $gt: 0 } });

    const typeReuseStats = await Material.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          reused: { $sum: { $cond: [{ $gt: ['$usageCount', 0] }, 1, 0] } },
          totalUsage: { $sum: '$usageCount' },
        },
      },
    ]);

    res.json({
      topReused,
      summary: {
        total: totalCount,
        reused: reusedCount,
        reuseRate: totalCount > 0 ? ((reusedCount / totalCount) * 100).toFixed(2) : 0,
      },
      byType: typeReuseStats.map(s => ({
        type: s._id,
        total: s.total,
        reused: s.reused,
        totalUsage: s.totalUsage,
        reuseRate: s.total > 0 ? ((s.reused / s.total) * 100).toFixed(2) : 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/articles/trend', requireAuth, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const dailyStats = await Article.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const result = dailyStats.map(s => ({
      date: `${s._id.year}-${String(s._id.month).padStart(2, '0')}-${String(s._id.day).padStart(2, '0')}`,
      count: s.count,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
