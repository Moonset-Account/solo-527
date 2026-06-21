import express from 'express';
import Activity from '../models/Activity.js';
import Schedule from '../models/Schedule.js';
import CheckIn from '../models/CheckIn.js';
import Volunteer from '../models/Volunteer.js';
import Feedback from '../models/Feedback.js';
import Donation from '../models/Donation.js';
import Absence from '../models/Absence.js';
import Alert from '../models/Alert.js';
import { auth } from '../middleware/auth.js';
import { cacheGet, cacheSet } from '../config/redis.js';

const router = express.Router();

router.get('/dashboard', auth, async (req, res, next) => {
  try {
    const cacheKey = 'stats:dashboard';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const [
      totalActivities,
      activeActivities,
      totalVolunteers,
      activeVolunteers,
      totalSchedules,
      todaySchedules,
      totalCheckIns,
      todayCheckIns,
      pendingFeedbacks,
      urgentFeedbacks,
      pendingDonations,
      activeAlerts,
      criticalAlerts,
      openAbsences
    ] = await Promise.all([
      Activity.countDocuments(),
      Activity.countDocuments({ status: { $in: ['published', 'ongoing'] } }),
      Volunteer.countDocuments(),
      Volunteer.countDocuments({ status: 'active' }),
      Schedule.countDocuments(),
      Schedule.countDocuments({
        date: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      }),
      CheckIn.countDocuments(),
      CheckIn.countDocuments({
        createdAt: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      }),
      Feedback.countDocuments({ status: { $in: ['pending', 'reviewing'] } }),
      Feedback.countDocuments({ priority: { $in: ['high', 'urgent'] }, status: { $ne: 'resolved' } }),
      Donation.countDocuments({ status: 'pending' }),
      Alert.countDocuments({ status: 'active' }),
      Alert.countDocuments({ status: 'active', severity: { $in: ['danger', 'critical'] } }),
      Absence.countDocuments({ status: { $in: ['reported', 'handling'] } })
    ]);

    const totalHoursResult = await CheckIn.aggregate([
      { $match: { status: 'checked_out' } },
      { $group: { _id: null, total: { $sum: '$hours' } } }
    ]);
    const totalHours = totalHoursResult[0]?.total || 0;

    const monthHoursResult = await CheckIn.aggregate([
      { $match: { checkInTime: { $gte: startOfMonth }, status: 'checked_out' } },
      { $group: { _id: null, total: { $sum: '$hours' } } }
    ]);
    const monthHours = monthHoursResult[0]?.total || 0;

    const totalDonationAmountResult = await Donation.aggregate([
      { $match: { status: 'received', type: 'money' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDonationAmount = totalDonationAmountResult[0]?.total || 0;

    const activityTypeStats = await Activity.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const stats = {
      overview: {
        totalActivities,
        activeActivities,
        totalVolunteers,
        activeVolunteers,
        totalSchedules,
        todaySchedules,
        totalCheckIns,
        todayCheckIns,
        totalHours: Math.round(totalHours * 10) / 10,
        monthHours: Math.round(monthHours * 10) / 10
      },
      donations: {
        pending: pendingDonations,
        totalAmount: totalDonationAmount
      },
      feedbacks: {
        pending: pendingFeedbacks,
        urgent: urgentFeedbacks
      },
      alerts: {
        active: activeAlerts,
        critical: criticalAlerts
      },
      absences: {
        open: openAbsences
      },
      activityTypes: activityTypeStats.map(s => ({ type: s._id, count: s.count }))
    };

    await cacheSet(cacheKey, stats, 60);

    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

router.get('/weekly', auth, async (req, res, next) => {
  try {
    const cacheKey = 'stats:weekly';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }

    const dailyStats = [];

    for (const day of days) {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const [checkIns, newVolunteers, newFeedbacks, schedules] = await Promise.all([
        CheckIn.countDocuments({
          checkInTime: { $gte: day, $lt: nextDay }
        }),
        Volunteer.countDocuments({
          createdAt: { $gte: day, $lt: nextDay }
        }),
        Feedback.countDocuments({
          createdAt: { $gte: day, $lt: nextDay }
        }),
        Schedule.countDocuments({
          date: { $gte: day, $lt: nextDay }
        })
      ]);

      const hoursResult = await CheckIn.aggregate([
        { $match: { checkInTime: { $gte: day, $lt: nextDay }, status: 'checked_out' } },
        { $group: { _id: null, total: { $sum: '$hours' } } }
      ]);

      dailyStats.push({
        date: day.toISOString().split('T')[0],
        checkIns,
        hours: Math.round((hoursResult[0]?.total || 0) * 10) / 10,
        newVolunteers,
        newFeedbacks,
        schedules
      });
    }

    await cacheSet(cacheKey, dailyStats, 180);

    res.json({ dailyStats });
  } catch (error) {
    next(error);
  }
});

router.get('/public', async (req, res, next) => {
  try {
    const cacheKey = 'stats:public';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [
      totalActivities,
      totalVolunteers,
      totalDonations
    ] = await Promise.all([
      Activity.countDocuments({ isPublic: true, status: { $in: ['published', 'ongoing', 'completed'] } }),
      Volunteer.countDocuments({ status: 'active' }),
      Donation.countDocuments({ isPublic: true, status: 'received' })
    ]);

    const totalHoursResult = await CheckIn.aggregate([
      { $match: { status: 'checked_out' } },
      { $group: { _id: null, total: { $sum: '$hours' } } }
    ]);

    const totalDonationAmountResult = await Donation.aggregate([
      { $match: { status: 'received', type: 'money', isPublic: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const stats = {
      totalActivities,
      totalVolunteers,
      totalVolunteerHours: Math.round((totalHoursResult[0]?.total || 0) * 10) / 10,
      totalDonations,
      totalDonationAmount: totalDonationAmountResult[0]?.total || 0
    };

    await cacheSet(cacheKey, stats, 300);

    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

export default router;
