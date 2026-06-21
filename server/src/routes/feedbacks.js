import express from 'express';
import Feedback from '../models/Feedback.js';
import { auth } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type,
      priority,
      volunteerId,
      activityId
    } = req.query;

    const cacheKey = `feedbacks:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (volunteerId) query.volunteerId = volunteerId;
    if (activityId) query.activityId = activityId;

    const feedbacks = await Feedback.find(query)
      .populate('volunteerId', 'name phone team')
      .populate('activityId', 'title')
      .populate('reviewer', 'name')
      .populate('handler', 'name')
      .populate('closedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    const result = {
      feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    await cacheSet(cacheKey, result, 60);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('volunteerId', 'name phone team')
      .populate('activityId', 'title description')
      .populate('scheduleId', 'shiftName date')
      .populate('reviewer', 'name role')
      .populate('handler', 'name role')
      .populate('closedBy', 'name');

    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const {
      activityId,
      scheduleId,
      volunteerId,
      type,
      title,
      content,
      rating,
      priority,
      attachments,
      sourceOrderId,
      sourceOrderType
    } = req.body;

    const feedback = new Feedback({
      activityId,
      scheduleId,
      volunteerId,
      type: type || 'suggestion',
      title,
      content,
      rating,
      priority: priority || 'medium',
      attachments,
      sourceOrderId,
      sourceOrderType,
      status: 'pending'
    });

    await feedback.save();
    await cacheDel('feedbacks:*');

    res.status(201).json({ feedback });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/review', auth, async (req, res, next) => {
  try {
    const { status, reviewComment, handler } = req.body;

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    feedback.reviewer = req.user._id;
    feedback.reviewedAt = new Date();
    if (reviewComment) feedback.reviewComment = reviewComment;
    if (status) feedback.status = status;
    if (handler) feedback.handler = handler;

    await feedback.save();
    await cacheDel('feedbacks:*');

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/handle', auth, async (req, res, next) => {
  try {
    const { handlePlan, status } = req.body;

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    if (handlePlan) feedback.handlePlan = handlePlan;
    if (status) {
      feedback.status = status;
    } else if (!['resolved', 'rejected', 'closed'].includes(feedback.status)) {
      feedback.status = 'handling';
    }
    feedback.handler = req.user._id;
    feedback.handledAt = new Date();

    await feedback.save();
    await cacheDel('feedbacks:*');

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/close', auth, async (req, res, next) => {
  try {
    const { closeNote } = req.body;

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    feedback.status = 'resolved';
    feedback.closeNote = closeNote;
    feedback.closedAt = new Date();
    feedback.closedBy = req.user._id;

    await feedback.save();
    await cacheDel('feedbacks:*');

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    const updatableFields = [
      'type', 'title', 'content', 'rating', 'priority',
      'status', 'attachments'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        feedback[field] = req.body[field];
      }
    });

    await feedback.save();
    await cacheDel('feedbacks:*');

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    await cacheDel('feedbacks:*');
    res.json({ message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

export default router;
