import express from 'express';
import CheckIn from '../models/CheckIn.js';
import Schedule from '../models/Schedule.js';
import { auth } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      scheduleId, 
      volunteerId,
      activityId,
      startDate,
      endDate
    } = req.query;

    const cacheKey = `checkins:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {};
    if (status) query.status = status;
    if (scheduleId) query.scheduleId = scheduleId;
    if (volunteerId) query.volunteerId = volunteerId;
    if (activityId) query.activityId = activityId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const checkIns = await CheckIn.find(query)
      .populate('scheduleId', 'shiftName date startTime endTime')
      .populate('volunteerId', 'name phone team')
      .populate('activityId', 'title')
      .sort({ checkInTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CheckIn.countDocuments(query);

    const result = {
      checkIns,
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
    const checkIn = await CheckIn.findById(req.params.id)
      .populate('scheduleId', 'shiftName date startTime endTime location')
      .populate('volunteerId', 'name phone team skills')
      .populate('activityId', 'title description location');

    if (!checkIn) {
      return res.status(404).json({ error: '签到记录不存在' });
    }

    res.json({ checkIn });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { scheduleId, volunteerId, checkInLocation, remark } = req.body;

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: '排班不存在' });
    }

    const existingCheckIn = await CheckIn.findOne({ scheduleId, volunteerId });
    if (existingCheckIn) {
      return res.status(400).json({ error: '该志愿者已签到' });
    }

    const volunteerInSchedule = schedule.volunteers.find(
      v => v.volunteerId.toString() === volunteerId && v.status !== 'cancelled'
    );

    if (!volunteerInSchedule) {
      return res.status(400).json({ error: '志愿者未报名该班次' });
    }

    const checkIn = new CheckIn({
      scheduleId,
      activityId: schedule.activityId,
      volunteerId,
      checkInTime: new Date(),
      checkInLocation,
      status: 'checked_in',
      checkedInBy: req.user._id,
      remark
    });

    await checkIn.save();

    volunteerInSchedule.status = 'checked_in';
    volunteerInSchedule.checkedInAt = new Date();
    await schedule.save();

    await cacheDel('checkins:*');
    await cacheDel('schedules:*');

    res.status(201).json({ checkIn });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/checkout', auth, async (req, res, next) => {
  try {
    const { checkOutLocation, remark, hours } = req.body;

    const checkIn = await CheckIn.findById(req.params.id);
    if (!checkIn) {
      return res.status(404).json({ error: '签到记录不存在' });
    }

    if (checkIn.status === 'checked_out') {
      return res.status(400).json({ error: '已签退' });
    }

    checkIn.checkOutTime = new Date();
    checkIn.checkOutLocation = checkOutLocation;
    checkIn.status = 'checked_out';
    checkIn.checkedOutBy = req.user._id;
    if (remark) checkIn.remark = remark;

    if (hours) {
      checkIn.hours = hours;
    } else if (checkIn.checkInTime) {
      const diff = (checkIn.checkOutTime - checkIn.checkInTime) / (1000 * 60 * 60);
      checkIn.hours = Math.round(diff * 10) / 10;
    }

    await checkIn.save();

    const schedule = await Schedule.findById(checkIn.scheduleId);
    if (schedule) {
      const volunteer = schedule.volunteers.find(
        v => v.volunteerId.toString() === checkIn.volunteerId.toString()
      );
      if (volunteer) {
        volunteer.status = 'checked_out';
        volunteer.checkedOutAt = new Date();
        volunteer.hours = checkIn.hours;
        await schedule.save();
      }
    }

    await cacheDel('checkins:*');
    await cacheDel('schedules:*');

    res.json({ checkIn });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', auth, async (req, res, next) => {
  try {
    const { status, remark } = req.body;

    const checkIn = await CheckIn.findById(req.params.id);
    if (!checkIn) {
      return res.status(404).json({ error: '签到记录不存在' });
    }

    checkIn.status = status;
    if (remark) checkIn.remark = remark;

    await checkIn.save();
    await cacheDel('checkins:*');

    res.json({ checkIn });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const checkIn = await CheckIn.findByIdAndDelete(req.params.id);
    if (!checkIn) {
      return res.status(404).json({ error: '签到记录不存在' });
    }

    await cacheDel('checkins:*');
    res.json({ message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

router.post('/batch', auth, async (req, res, next) => {
  try {
    const { scheduleId, volunteerIds, type } = req.body;

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: '排班不存在' });
    }

    const results = [];

    for (const volunteerId of volunteerIds) {
      try {
        if (type === 'checkin') {
          const existing = await CheckIn.findOne({ scheduleId, volunteerId });
          if (!existing) {
            const volunteerInSchedule = schedule.volunteers.find(
              v => v.volunteerId.toString() === volunteerId && v.status !== 'cancelled'
            );
            
            if (volunteerInSchedule) {
              const checkIn = new CheckIn({
                scheduleId,
                activityId: schedule.activityId,
                volunteerId,
                checkInTime: new Date(),
                status: 'checked_in',
                checkedInBy: req.user._id
              });
              await checkIn.save();
              
              volunteerInSchedule.status = 'checked_in';
              volunteerInSchedule.checkedInAt = new Date();
              
              results.push({ volunteerId, success: true, checkIn });
            } else {
              results.push({ volunteerId, success: false, error: '志愿者未报名' });
            }
          } else {
            results.push({ volunteerId, success: false, error: '已签到' });
          }
        }
      } catch (error) {
        results.push({ volunteerId, success: false, error: error.message });
      }
    }

    await schedule.save();
    await cacheDel('checkins:*');
    await cacheDel('schedules:*');

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

export default router;
