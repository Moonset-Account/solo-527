import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../member/member.schema';
import { Coupon } from '../coupon/coupon.schema';
import { PointsRecord } from '../points/points.schema';
import { RedeemRecord } from '../redeem/redeem.schema';
import { ActivityRecord } from '../activity/activity.schema';
import { ReachLog } from '../reach-log/reach-log.schema';
import { MemberLevel, ReachStatus } from '../../common/enums';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<Member>,
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
    @InjectModel(PointsRecord.name) private pointsModel: Model<PointsRecord>,
    @InjectModel(RedeemRecord.name) private redeemModel: Model<RedeemRecord>,
    @InjectModel(ActivityRecord.name) private activityModel: Model<ActivityRecord>,
    @InjectModel(ReachLog.name) private reachLogModel: Model<ReachLog>,
  ) {}

  async getOverview(params: any = {}) {
    const { envLabel, storeId } = params;
    const memberQuery: any = { active: true };
    if (storeId) memberQuery.storeId = storeId;

    const couponQuery: any = {};
    if (storeId) couponQuery.storeId = storeId;

    const reachQuery: any = {};
    if (storeId) reachQuery.storeId = storeId;
    if (envLabel) reachQuery.envLabel = envLabel;

    const [memberTotal, levelStats, couponStats, pointsStats, activityStats, reachStats] = await Promise.all([
      this.memberModel.countDocuments(memberQuery),
      this.memberModel.aggregate([
        { $match: memberQuery },
        { $group: { _id: '$level', count: { $sum: 1 } } },
      ]),
      this.couponModel.aggregate([
        { $match: couponQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.pointsModel.aggregate([
        { $match: { storeId: storeId || { $exists: true } } },
        { $group: { _id: '$type', total: { $sum: '$points' }, count: { $sum: 1 } } },
      ]),
      this.activityModel.countDocuments({ storeId: storeId || { $exists: true } }),
      this.reachLogModel.aggregate([
        { $match: reachQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      memberTotal,
      levelStats,
      couponStats,
      pointsStats,
      activityTotal: activityStats,
      reachStats,
    };
  }

  async getMemberGrowth(params: any = {}) {
    const { startDate, endDate, storeId } = params;
    const match: any = { active: true };
    if (storeId) match.storeId = storeId;
    if (startDate) match.registerTime = { $gte: new Date(startDate) };
    if (endDate) match.registerTime = { ...match.registerTime, $lte: new Date(endDate + 'T23:59:59') };

    const daily = await this.memberModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$registerTime' } },
          newMembers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    return daily.map(d => ({ date: d._id, newMembers: d.newMembers }));
  }

  async getReachReport(params: any = {}) {
    const { startDate, endDate, envLabel, type, storeId } = params;
    const match: any = {};
    if (startDate || endDate) {
      match.sendTime = {};
      if (startDate) match.sendTime.$gte = new Date(startDate);
      if (endDate) match.sendTime.$lte = new Date(endDate + 'T23:59:59');
    }
    if (envLabel) match.envLabel = envLabel;
    if (type) match.type = type;
    if (storeId) match.storeId = storeId;

    const [byType, byStatus, byDay, total] = await Promise.all([
      this.reachLogModel.aggregate([
        { $match: match },
        { $group: { _id: '$type', total: { $sum: 1 }, success: { $sum: { $cond: [{ $eq: ['$status', ReachStatus.SUCCESS] }, 1, 0] } } } },
      ]),
      this.reachLogModel.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.reachLogModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$sendTime' } },
            total: { $sum: 1 },
            success: { $sum: { $cond: [{ $eq: ['$status', ReachStatus.SUCCESS] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', ReachStatus.FAILED] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      this.reachLogModel.countDocuments(match),
    ]);

    return { total, byType, byStatus, byDay: byDay.map(d => ({ date: d._id, ...d })) };
  }
}
