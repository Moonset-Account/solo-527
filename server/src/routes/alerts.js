import express from 'express';
import Alert from '../models/Alert.js';
import { auth } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      severity,
      type,
      assignedTo
    } = req.query;

    const cacheKey = `alerts:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (assignedTo) query.assignedTo = assignedTo;

    const alerts = await Alert.find(query)
      .populate('assignedTo', 'name role')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .populate('activityId', 'title')
      .populate('scheduleId', 'shiftName date')
      .populate('volunteerId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(query);

    const stats = {
      active: await Alert.countDocuments({ status: 'active' }),
      warning: await Alert.countDocuments({ status: 'active', severity: 'warning' }),
      danger: await Alert.countDocuments({ status: 'active', severity: 'danger' }),
      critical: await Alert.countDocuments({ status: 'active', severity: 'critical' })
    };

    const result = {
      alerts,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    await cacheSet(cacheKey, result, 30);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('assignedTo', 'name role phone')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .populate('activityId', 'title description')
      .populate('scheduleId', 'shiftName date startTime endTime')
      .populate('volunteerId', 'name phone team');

    if (!alert) {
      return res.status(404).json({ error: '预警不存在' });
    }

    res.json({ alert });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const {
      type,
      title,
      message,
      severity,
      relatedId,
      relatedType,
      activityId,
      scheduleId,
      volunteerId,
      assignedTo,
      metadata
    } = req.body;

    const alert = new Alert({
      type,
      title,
      message,
      severity: severity || 'warning',
      relatedId,
      relatedType,
      activityId,
      scheduleId,
      volunteerId,
      assignedTo,
      metadata,
      status: 'active'
    });

    await alert.save();
    await cacheDel('alerts:*');

    res.status(201).json({ alert });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/acknowledge', auth, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: '预警不存在' });
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = req.user._id;
    alert.acknowledgedAt = new Date();

    await alert.save();
    await cacheDel('alerts:*');

    res.json({ alert });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/resolve', auth, async (req, res, next) => {
  try {
    const { resolutionNote } = req.body;

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: '预警不存在' });
    }

    alert.status = 'resolved';
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    if (resolutionNote) alert.resolutionNote = resolutionNote;

    await alert.save();
    await cacheDel('alerts:*');

    res.json({ alert });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/dismiss', auth, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: '预警不存在' });
    }

    alert.status = 'dismissed';
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();

    await alert.save();
    await cacheDel('alerts:*');

    res.json({ alert });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: '预警不存在' });
    }

    const updatableFields = [
      'type', 'title', 'message', 'severity', 'status',
      'assignedTo', 'metadata'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        alert[field] = req.body[field];
      }
    });

    await alert.save();
    await cacheDel('alerts:*');

    res.json({ alert });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: '预警不存在' });
    }

    await cacheDel('alerts:*');
    res.json({ message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

export default router;
