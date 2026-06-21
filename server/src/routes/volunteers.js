import express from 'express';
import Volunteer from '../models/Volunteer.js';
import { auth } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      team,
      keyword,
      skill
    } = req.query;

    const cacheKey = `volunteers:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {};
    if (status) query.status = status;
    if (team) query.team = team;
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (skill) query.skills = skill;

    const volunteers = await Volunteer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Volunteer.countDocuments(query);

    const result = {
      volunteers,
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

router.get('/:id', auth, async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    
    if (!volunteer) {
      return res.status(404).json({ error: '志愿者不存在' });
    }

    res.json({ volunteer });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const {
      name,
      phone,
      idCard,
      gender,
      age,
      avatar,
      team,
      skills,
      remark
    } = req.body;

    const volunteer = new Volunteer({
      name,
      phone,
      idCard,
      gender,
      age,
      avatar,
      team,
      skills: skills || [],
      remark,
      createdBy: req.user._id
    });

    await volunteer.save();
    await cacheDel('volunteers:*');

    res.status(201).json({ volunteer });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ error: '志愿者不存在' });
    }

    const updatableFields = [
      'name', 'phone', 'idCard', 'gender', 'age',
      'avatar', 'team', 'skills', 'status', 'remark',
      'totalHours', 'totalActivities'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        volunteer[field] = req.body[field];
      }
    });

    await volunteer.save();
    await cacheDel('volunteers:*');

    res.json({ volunteer });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
    if (!volunteer) {
      return res.status(404).json({ error: '志愿者不存在' });
    }

    await cacheDel('volunteers:*');
    res.json({ message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

export default router;
