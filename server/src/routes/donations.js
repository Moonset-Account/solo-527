import express from 'express';
import Donation from '../models/Donation.js';
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
      donorType,
      activityId,
      isPublic,
      startDate,
      endDate
    } = req.query;

    const cacheKey = `donations:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (donorType) query.donorType = donorType;
    if (activityId) query.activityId = activityId;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const donations = await Donation.find(query)
      .populate('activityId', 'title')
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments(query);

    const stats = {
      totalAmount: 0,
      moneyCount: 0,
      materialCount: 0,
      serviceCount: 0
    };

    const allDonations = await Donation.find({ ...query, status: 'received' });
    allDonations.forEach(d => {
      if (d.type === 'money' && d.amount) {
        stats.totalAmount += d.amount;
        stats.moneyCount++;
      } else if (d.type === 'material') {
        stats.materialCount++;
      } else if (d.type === 'service') {
        stats.serviceCount++;
      }
    });

    const result = {
      donations,
      stats,
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

    const cacheKey = `donations:public:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = { isPublic: true, status: 'received' };
    if (type) query.type = type;

    const donations = await Donation.find(query)
      .select('donorName type amount items description publicNote createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments(query);

    const result = {
      donations,
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
    const donation = await Donation.findById(req.params.id)
      .populate('activityId', 'title description')
      .populate('receivedBy', 'name role');

    if (!donation) {
      return res.status(404).json({ error: '捐赠记录不存在' });
    }

    res.json({ donation });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const {
      donorName,
      donorPhone,
      donorType,
      type,
      amount,
      currency,
      items,
      description,
      activityId,
      attachments,
      remark,
      sourceOrderId,
      sourceOrderType
    } = req.body;

    const donation = new Donation({
      donorName,
      donorPhone,
      donorType: donorType || 'individual',
      type,
      amount,
      currency: currency || 'CNY',
      items,
      description,
      activityId,
      attachments,
      remark,
      sourceOrderId,
      sourceOrderType,
      status: 'pending'
    });

    await donation.save();
    await cacheDel('donations:*');

    res.status(201).json({ donation });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/confirm', auth, async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: '捐赠记录不存在' });
    }

    donation.status = 'confirmed';
    await donation.save();
    await cacheDel('donations:*');

    res.json({ donation });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/receive', auth, async (req, res, next) => {
  try {
    const { receiptNumber } = req.body;

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: '捐赠记录不存在' });
    }

    donation.status = 'received';
    donation.receivedBy = req.user._id;
    donation.receivedAt = new Date();
    if (receiptNumber) donation.receiptNumber = receiptNumber;

    await donation.save();
    await cacheDel('donations:*');

    res.json({ donation });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/public', auth, async (req, res, next) => {
  try {
    const { isPublic, publicNote } = req.body;

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: '捐赠记录不存在' });
    }

    donation.isPublic = isPublic !== undefined ? isPublic : true;
    if (publicNote) donation.publicNote = publicNote;

    await donation.save();
    await cacheDel('donations:*');

    res.json({ donation });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: '捐赠记录不存在' });
    }

    const updatableFields = [
      'donorName', 'donorPhone', 'donorType', 'type', 'amount',
      'currency', 'items', 'description', 'activityId',
      'status', 'receiptNumber', 'receiptIssued', 'receiptDate',
      'attachments', 'remark', 'isPublic', 'publicNote'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        donation[field] = req.body[field];
      }
    });

    await donation.save();
    await cacheDel('donations:*');

    res.json({ donation });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: '捐赠记录不存在' });
    }

    await cacheDel('donations:*');
    res.json({ message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

export default router;
