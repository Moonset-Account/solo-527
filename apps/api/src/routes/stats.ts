import { Router, Request, Response } from 'express';
import { SeatModel } from '../models/Seat';
import { UsageRecordModel } from '../models/UsageRecord';
import { ReminderModel } from '../models/Reminder';
import { PaymentCallbackModel } from '../models/PaymentCallback';
import { calcUsagePercent, getDaysUntilExpiry } from '../utils';

const router = Router();

router.get('/overview', async (_req: Request, res: Response) => {
  const [
    totalSeats,
    activeSeats,
    trialSeats,
    expiredSeats,
    totalReminders,
    pendingReminders,
    totalUsageCalls,
    totalUsageErrors,
  ] = await Promise.all([
    SeatModel.countDocuments(),
    SeatModel.countDocuments({ status: 'active' }),
    SeatModel.countDocuments({ trialStatus: 'in_progress' }),
    SeatModel.countDocuments({ status: 'expired' }),
    ReminderModel.countDocuments(),
    ReminderModel.countDocuments({ status: { $in: ['pending', 'sent'] } }),
    UsageRecordModel.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: '$apiCalls' } } },
    ]).then((r) => r[0]?.total || 0),
    UsageRecordModel.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: '$errorCount' } } },
    ]).then((r) => r[0]?.total || 0),
  ]);

  const highUsageSeats = await SeatModel.find({ quota: { $gt: 0 } })
    .select('seatCode customerName quota usedQuota status expireDate')
    .sort({ usedQuota: -1 })
    .limit(5)
    .lean()
    .exec()
    .then((list) =>
      list.map((s) => ({
        seatCode: s.seatCode,
        customerName: s.customerName,
        status: s.status,
        quota: s.quota,
        usedQuota: s.usedQuota,
        usagePercent: calcUsagePercent(s.usedQuota, s.quota),
        daysUntilExpiry: getDaysUntilExpiry(s.expireDate),
      }))
    );

  const recentPayments = await PaymentCallbackModel.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('seatCode customerName transactionId amount callbackStatus riskLevel createdAt')
    .lean()
    .exec();

  res.json({
    totalSeats,
    activeSeats,
    trialSeats,
    expiredSeats,
    totalReminders,
    pendingReminders,
    totalUsageCalls,
    totalUsageErrors,
    highUsageSeats,
    recentPayments,
  });
});

export default router;
