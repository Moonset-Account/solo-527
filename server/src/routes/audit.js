import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { requireAuth } from '../middleware/auth.js';
import { redisClient } from '../config/redis.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      entityType = '',
      entityId = '',
      action = '',
      operatorId = '',
      keyword = '',
      startDate = '',
      endDate = '',
    } = req.query;

    const cacheKey = `audit:${JSON.stringify(req.query)}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const query = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (action) query.action = action;
    if (operatorId) query.operatorId = operatorId;
    if (keyword) {
      query.$or = [
        { entityTitle: { $regex: keyword, $options: 'i' } },
        { operatorName: { $regex: keyword, $options: 'i' } },
        { remark: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await AuditLog.countDocuments(query);
    const items = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .lean();

    const result = {
      items,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize),
    };

    await redisClient.setEx(cacheKey, 60, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/entity/:entityType/:entityId', requireAuth, async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    const query = { entityType, entityId };

    const total = await AuditLog.countDocuments(query);
    const items = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .lean();

    res.json({
      items,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/changes/:entityType/:entityId', requireAuth, async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;

    const logs = await AuditLog.find({
      entityType,
      entityId,
      changes: { $exists: true, $not: { $size: 0 } },
    })
      .sort({ createdAt: -1 })
      .select('changes operatorName operatorRole createdAt action remark')
      .lean();

    const fieldChanges = {};

    for (const log of logs) {
      for (const change of log.changes) {
        if (!fieldChanges[change.field]) {
          fieldChanges[change.field] = [];
        }
        fieldChanges[change.field].push({
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          oldLabel: change.oldLabel,
          newLabel: change.newLabel,
          operatorName: log.operatorName,
          operatorRole: log.operatorRole,
          changedAt: log.createdAt,
          action: log.action,
          remark: log.remark,
        });
      }
    }

    res.json(fieldChanges);
  } catch (err) {
    next(err);
  }
});

export default router;
