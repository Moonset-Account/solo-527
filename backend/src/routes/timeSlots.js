const express = require('express');
const dayjs = require('dayjs');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { counselorId, date, startDate, endDate, active } = req.query;
    const where = {};

    if (counselorId) {
      where.counselorId = parseInt(counselorId);
    }

    if (date) {
      const d = dayjs(date).startOf('day');
      where.date = {
        gte: d.toDate(),
        lt: d.add(1, 'day').toDate(),
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: dayjs(startDate).startOf('day').toDate(),
        lte: dayjs(endDate).endOf('day').toDate(),
      };
    }

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const slots = await prisma.timeSlot.findMany({
      where,
      include: {
        counselor: true,
        appointments: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    const enriched = slots.map((slot) => ({
      ...slot,
      available: slot.capacity - slot.bookedCount,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { counselorId, date, startTime, endTime, duration, capacity } = req.body;

    if (!counselorId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const slot = await prisma.timeSlot.create({
      data: {
        counselorId: parseInt(counselorId),
        date: dayjs(date).startOf('day').toDate(),
        startTime,
        endTime,
        duration: duration || 50,
        capacity: capacity || 1,
      },
    });

    res.json({ success: true, data: slot });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, message: '该时段已存在' });
    }
    next(err);
  }
});

router.post('/batch', async (req, res, next) => {
  try {
    const { counselorId, startDate, endDate, startTime, endTime, duration, capacity, weekdays } = req.body;

    if (!counselorId || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const start = dayjs(startDate).startOf('day');
    const end = dayjs(endDate).startOf('day');
    const days = [];
    let current = start;

    while (current.isBefore(end) || current.isSame(end)) {
      if (!weekdays || weekdays.length === 0 || weekdays.includes(current.day())) {
        days.push(current.toDate());
      }
      current = current.add(1, 'day');
    }

    const created = [];
    for (const d of days) {
      try {
        const slot = await prisma.timeSlot.create({
          data: {
            counselorId: parseInt(counselorId),
            date: d,
            startTime,
            endTime,
            duration: duration || 50,
            capacity: capacity || 1,
          },
        });
        created.push(slot);
      } catch (e) {
        if (e.code !== 'P2002') throw e;
      }
    }

    res.json({ success: true, data: created, count: created.length });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { startTime, endTime, duration, capacity, isActive } = req.body;
    const slot = await prisma.timeSlot.update({
      where: { id: parseInt(req.params.id) },
      data: { startTime, endTime, duration, capacity, isActive },
    });
    res.json({ success: true, data: slot });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.timeSlot.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.json({ success: true, message: '已停用' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
