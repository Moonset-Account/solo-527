const express = require('express');
const dayjs = require('dayjs');
const prisma = require('../prisma');

const router = express.Router();

router.get('/overview', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().startOf('month').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : dayjs().endOf('month').toDate();

    const where = {
      timeSlot: {
        date: { gte: start, lte: end },
      },
    };

    const [
      totalAppointments,
      completed,
      noShows,
      checkedIn,
      pending,
      waitlisted,
      waitlistExpired,
      cancelled,
    ] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { ...where, status: 'NO_SHOW' } }),
      prisma.appointment.count({ where: { ...where, status: 'CHECKED_IN' } }),
      prisma.appointment.count({ where: { ...where, status: 'PENDING' } }),
      prisma.appointment.count({ where: { ...where, isWaitlisted: true } }),
      prisma.appointment.count({ where: { ...where, waitlistExpired: true } }),
      prisma.appointment.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    const totalHandled = completed + noShows + checkedIn;
    const checkInEfficiency = totalHandled > 0 ? Math.round(((completed + checkedIn) / totalHandled) * 100) : 0;
    const noShowRate = totalAppointments > 0 ? Math.round((noShows / totalAppointments) * 100) : 0;

    const perCounselor = await prisma.counselor.findMany({
      where: { isActive: true },
      include: {
        appointments: {
          where,
        },
      },
    });

    const counselorStats = perCounselor.map((c) => {
      const total = c.appointments.length;
      const comp = c.appointments.filter((a) => a.status === 'COMPLETED' || a.status === 'CHECKED_IN').length;
      const nosh = c.appointments.filter((a) => a.status === 'NO_SHOW').length;
      return {
        id: c.id,
        name: c.name,
        title: c.title,
        total,
        completed: comp,
        noShows: nosh,
        efficiency: total > 0 ? Math.round((comp / total) * 100) : 0,
      };
    });

    res.json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalAppointments,
          completed,
          checkedIn,
          pending,
          noShows,
          waitlisted,
          waitlistExpired,
          cancelled,
          checkInEfficiency,
          noShowRate,
        },
        byCounselor: counselorStats,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/daily', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? dayjs(startDate).startOf('day') : dayjs().startOf('week');
    const end = endDate ? dayjs(endDate).endOf('day') : dayjs().endOf('week');

    const days = [];
    let current = start;
    while (current.isBefore(end) || current.isSame(end)) {
      days.push(current);
      current = current.add(1, 'day');
    }

    const daily = [];
    for (const d of days) {
      const where = {
        timeSlot: {
          date: {
            gte: d.startOf('day').toDate(),
            lte: d.endOf('day').toDate(),
          },
        },
      };
      const [total, completed, noShows] = await Promise.all([
        prisma.appointment.count({ where }),
        prisma.appointment.count({ where: { ...where, status: { in: ['COMPLETED', 'CHECKED_IN'] } } }),
        prisma.appointment.count({ where: { ...where, status: 'NO_SHOW' } }),
      ]);
      daily.push({
        date: d.format('YYYY-MM-DD'),
        total,
        completed,
        noShows,
        efficiency: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }

    res.json({ success: true, data: daily });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
