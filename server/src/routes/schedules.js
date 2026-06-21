import express from 'express';
import Schedule from '../models/Schedule.js';
import Activity from '../models/Activity.js';
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
      activityId, 
      startDate, 
      endDate,
      team
    } = req.query;

    const cacheKey = `schedules:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {};
    if (status) query.status = status;
    if (activityId) query.activityId = activityId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const schedules = await Schedule.find(query)
      .populate('activityId', 'title type status')
      .populate('teamLeader', 'name role')
      .populate('volunteers.volunteerId', 'name phone team')
      .sort({ date: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Schedule.countDocuments(query);

    const result = {
      schedules,
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
    const schedule = await Schedule.findById(req.params.id)
      .populate('activityId', 'title description location type status')
      .populate('teamLeader', 'name role phone')
      .populate('volunteers.volunteerId', 'name phone team skills status');

    if (!schedule) {
      return res.status(404).json({ error: '排班不存在' });
    }

    res.json({ schedule });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const {
      activityId,
      date,
      shiftName,
      startTime,
      endTime,
      location,
      maxVolunteers,
      minVolunteers,
      requiredSkills,
      description,
      teamLeader,
      remarks
    } = req.body;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    const schedule = new Schedule({
      activityId,
      date,
      shiftName,
      startTime,
      endTime,
      location,
      maxVolunteers,
      minVolunteers,
      requiredSkills,
      description,
      teamLeader: teamLeader || req.user._id,
      remarks
    });

    await schedule.save();
    await cacheDel('schedules:*');

    res.status(201).json({ schedule });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: '排班不存在' });
    }

    const updatableFields = [
      'date', 'shiftName', 'startTime', 'endTime', 'location',
      'maxVolunteers', 'minVolunteers', 'requiredSkills',
      'description', 'status', 'teamLeader', 'remarks'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        schedule[field] = req.body[field];
      }
    });

    await schedule.save();
    await cacheDel('schedules:*');

    res.json({ schedule });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/signup', auth, async (req, res, next) => {
  try {
    const { volunteerId } = req.body;
    
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: '排班不存在' });
    }

    if (schedule.status !== 'pending' && schedule.status !== 'active') {
      return res.status(400).json({ error: '该排班不接受报名' });
    }

    const existingVolunteer = schedule.volunteers.find(
      v => v.volunteerId.toString() === volunteerId
    );

    if (existingVolunteer) {
      return res.status(400).json({ error: '已报名该班次' });
    }

    const confirmedCount = schedule.volunteers.filter(
      v => v.status !== 'cancelled'
    ).length;

    if (confirmedCount >= schedule.maxVolunteers) {
      return res.status(400).json({ error: '该班次人数已满' });
    }

    schedule.volunteers.push({
      volunteerId,
      status: 'signed_up',
      signedUpAt: new Date()
    });

    await schedule.save();
    await cacheDel('schedules:*');

    res.json({ schedule });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/volunteers/:volunteerId', auth, async (req, res, next) => {
  try {
    const { status, remark, hours } = req.body;
    
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: '排班不存在' });
    }

    const volunteer = schedule.volunteers.find(
      v => v.volunteerId.toString() === req.params.volunteerId
    );

    if (!volunteer) {
      return res.status(404).json({ error: '志愿者不在该班次中' });
    }

    if (status) volunteer.status = status;
    if (remark) volunteer.remark = remark;
    if (hours !== undefined) volunteer.hours = hours;

    if (status === 'confirmed') volunteer.confirmedAt = new Date();
    if (status === 'checked_in') volunteer.checkedInAt = new Date();
    if (status === 'checked_out') volunteer.checkedOutAt = new Date();

    await schedule.save();
    await cacheDel('schedules:*');

    res.json({ schedule });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: '排班不存在' });
    }

    await cacheDel('schedules:*');
    res.json({ message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

router.get('/volunteer/:volunteerId', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = {
      'volunteers.volunteerId': req.params.volunteerId
    };

    const schedules = await Schedule.find(query)
      .populate('activityId', 'title type status location')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Schedule.countDocuments(query);

    res.json({
      schedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
