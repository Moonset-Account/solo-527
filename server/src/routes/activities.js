import express from 'express';
import Activity from '../models/Activity.js';
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
      keyword,
      startDate,
      endDate
    } = req.query;

    const cacheKey = `activities:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query)
      .populate('createdBy', 'name')
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Activity.countDocuments(query);

    const result = {
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    await cacheSet(cacheKey, result, 120);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/public', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const cacheKey = `activities:public:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = { isPublic: true, status: { $in: ['published', 'ongoing'] } };
    if (type) query.type = type;

    const activities = await Activity.find(query)
      .select('title description type location startDate endDate coverImage photos organizer status')
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Activity.countDocuments(query);

    const result = {
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    await cacheSet(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('createdBy', 'name role');

    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    res.json({ activity });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/public', async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .select('title description type location address startDate endDate coverImage photos organizer contactPerson contactPhone status');

    if (!activity || !activity.isPublic) {
      return res.status(404).json({ error: '活动不存在' });
    }

    res.json({ activity });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      location,
      address,
      startDate,
      endDate,
      maxVolunteers,
      minVolunteers,
      organizer,
      contactPerson,
      contactPhone,
      coverImage,
      remarks
    } = req.body;

    const activity = new Activity({
      title,
      description,
      type: type || 'community',
      location,
      address,
      startDate,
      endDate,
      maxVolunteers: maxVolunteers || 20,
      minVolunteers: minVolunteers || 5,
      organizer,
      contactPerson,
      contactPhone,
      coverImage,
      remarks,
      createdBy: req.user._id,
      status: 'draft'
    });

    await activity.save();
    await cacheDel('activities:*');

    res.status(201).json({ activity });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const updatableFields = [
      'title', 'description', 'type', 'location', 'address',
      'startDate', 'endDate', 'maxVolunteers', 'minVolunteers',
      'status', 'organizer', 'contactPerson', 'contactPhone',
      'coverImage', 'remarks', 'isPublic'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        activity[field] = req.body[field];
      }
    });

    await activity.save();
    await cacheDel('activities:*');

    res.json({ activity });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/photos', auth, async (req, res, next) => {
  try {
    const { url, caption } = req.body;

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    activity.photos.push({
      url,
      caption,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    });

    await activity.save();
    await cacheDel('activities:*');

    res.json({ activity });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    await cacheDel('activities:*');
    res.json({ message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

export default router;
