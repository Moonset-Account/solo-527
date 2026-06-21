import express from 'express';
import Absence from '../models/Absence.js';
import Schedule from '../models/Schedule.js';
import CheckIn from '../models/CheckIn.js';
import { auth } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      impactLevel,
      priority,
      volunteerId,
      scheduleId,
      responsiblePerson,
      type
    } = req.query;

    const cacheKey = `absences:${JSON.stringify(req.query)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {};
    if (status) query.status = status;
    if (impactLevel) query.impactLevel = impactLevel;
    if (priority) query.priority = priority;
    if (volunteerId) query.volunteerId = volunteerId;
    if (scheduleId) query.scheduleId = scheduleId;
    if (responsiblePerson) query.responsiblePerson = responsiblePerson;
    if (type) query.type = type;

    const absences = await Absence.find(query)
      .populate('volunteerId', 'name phone team')
      .populate('scheduleId', 'shiftName date startTime endTime')
      .populate('activityId', 'title')
      .populate('responsiblePerson', 'name role')
      .populate('replacementVolunteer', 'name phone')
      .populate('reportedBy', 'name')
      .populate('closedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Absence.countDocuments(query);

    const result = {
      absences,
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
    const absence = await Absence.findById(req.params.id)
      .populate('volunteerId', 'name phone team skills')
      .populate('scheduleId', 'shiftName date startTime endTime location')
      .populate('activityId', 'title description location')
      .populate('responsiblePerson', 'name role phone')
      .populate('replacementVolunteer', 'name phone team')
      .populate('reportedBy', 'name role')
      .populate('closedBy', 'name role')
      .populate('checkInId');

    if (!absence) {
      return res.status(404).json({ error: '缺席记录不存在' });
    }

    res.json({ absence });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const {
      scheduleId,
      volunteerId,
      checkInId,
      type,
      reason,
      impactScope,
      impactLevel,
      responsiblePerson,
      responsiblePersonName,
      handlePlan,
      priority,
      replacementVolunteer,
      attachments,
      remarks,
      sourceOrderId,
      sourceOrderType
    } = req.body;

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: '排班不存在' });
    }

    const absence = new Absence({
      scheduleId,
      activityId: schedule.activityId,
      volunteerId,
      checkInId,
      type: type || 'no_show',
      reason,
      impactScope,
      impactLevel: impactLevel || 'medium',
      responsiblePerson,
      responsiblePersonName,
      handlePlan,
      priority: priority || 'medium',
      replacementVolunteer,
      attachments,
      remarks,
      sourceOrderId,
      sourceOrderType,
      status: 'reported',
      reportedBy: req.user._id
    });

    await absence.save();

    const volunteer = schedule.volunteers.find(
      v => v.volunteerId.toString() === volunteerId
    );
    if (volunteer) {
      volunteer.status = 'absent';
      await schedule.save();
    }

    await cacheDel('absences:*');
    await cacheDel('schedules:*');

    res.status(201).json({ absence });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/handle', auth, async (req, res, next) => {
  try {
    const { handlePlan, replacementVolunteer, status } = req.body;

    const absence = await Absence.findById(req.params.id);
    if (!absence) {
      return res.status(404).json({ error: '缺席记录不存在' });
    }

    if (handlePlan) absence.handlePlan = handlePlan;
    if (replacementVolunteer) absence.replacementVolunteer = replacementVolunteer;
    if (status) absence.status = status;
    absence.responsiblePerson = req.user._id;

    await absence.save();
    await cacheDel('absences:*');

    res.json({ absence });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/close', auth, async (req, res, next) => {
  try {
    const { closeNote } = req.body;

    const absence = await Absence.findById(req.params.id);
    if (!absence) {
      return res.status(404).json({ error: '缺席记录不存在' });
    }

    absence.status = 'closed';
    absence.closeNote = closeNote;
    absence.closedAt = new Date();
    absence.closedBy = req.user._id;

    await absence.save();
    await cacheDel('absences:*');

    res.json({ absence });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const absence = await Absence.findById(req.params.id);
    if (!absence) {
      return res.status(404).json({ error: '缺席记录不存在' });
    }

    const updatableFields = [
      'type', 'reason', 'impactScope', 'impactLevel',
      'responsiblePerson', 'responsiblePersonName', 'handlePlan',
      'status', 'priority', 'replacementVolunteer',
      'attachments', 'remarks'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        absence[field] = req.body[field];
      }
    });

    await absence.save();
    await cacheDel('absences:*');

    res.json({ absence });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const absence = await Absence.findByIdAndDelete(req.params.id);
    if (!absence) {
      return res.status(404).json({ error: '缺席记录不存在' });
    }

    await cacheDel('absences:*');
    res.json({ message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

export default router;
