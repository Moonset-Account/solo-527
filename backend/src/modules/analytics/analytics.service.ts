import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { Order, OrderDocument, OrderStatus } from '../../schemas/order.schema';
import { Service, ServiceDocument } from '../../schemas/service.schema';
import { Worker, WorkerDocument } from '../../schemas/worker.schema';
import { Review, ReviewDocument } from '../../schemas/review.schema';
import { GroupByType, TrendGranularity } from './analytics.controller';

const CACHE_TTL = 300;
const ORDERS_PER_DAY_PER_WORKER = 5;
const IN_TRANSIT_STATUSES: OrderStatus[] = ['dispatched', 'arrived', 'inProgress'];

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Worker.name) private workerModel: Model<WorkerDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private generateCacheKey(prefix: string, data: Record<string, any>): string {
    const hash = createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `analytics:${prefix}:${hash}`;
  }

  private parseDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    const now = new Date();
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private getDateRangeFilter(start: Date, end: Date): Record<string, any> {
    return {
      scheduledAt: {
        $gte: start,
        $lt: end,
      },
    };
  }

  private getPreviousDateRange(start: Date, end: Date): { prevStart: Date; prevEnd: Date } {
    const duration = end.getTime() - start.getTime();
    return {
      prevStart: new Date(start.getTime() - duration),
      prevEnd: new Date(start.getTime()),
    };
  }

  async getOverview(startDate?: string, endDate?: string): Promise<any> {
    const { start, end } = this.parseDateRange(startDate, endDate);
    const cacheKey = this.generateCacheKey('overview', { start: start.toISOString(), end: end.toISOString() });
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const dateFilter = this.getDateRangeFilter(start, end);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [statusStats, ratingStats, todayStats, inTransitStats] = await Promise.all([
      this.orderModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            rescheduled: { $sum: { $cond: [{ $eq: ['$status', 'rescheduled'] }, 1, 0] } },
            totalRescheduleCount: { $sum: { $ifNull: ['$rescheduleCount', 0] } },
            onTimeScheduled: { $sum: { $cond: ['$onTimeRecord.scheduled', 1, 0] } },
            onTimeArrived: { $sum: { $cond: ['$onTimeRecord.arrived', 1, 0] } },
            onTimeCompleted: { $sum: { $cond: ['$onTimeRecord.completed', 1, 0] } },
            scheduledCount: { $sum: { $cond: [{ $ne: ['$onTimeRecord.scheduled', undefined] }, 1, 0] } },
            arrivedCount: { $sum: { $cond: [{ $ne: ['$actualArrivedAt', undefined] }, 1, 0] } },
            completedCount: { $sum: { $cond: [{ $ne: ['$actualCompletedAt', undefined] }, 1, 0] } },
          },
        },
      ]).exec(),

      this.reviewModel.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order',
          },
        },
        { $unwind: '$order' },
        { $match: { 'order.scheduledAt': dateFilter.scheduledAt } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ]).exec(),

      this.orderModel.aggregate([
        {
          $match: {
            scheduledAt: { $gte: todayStart, $lt: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]).exec(),

      this.orderModel.aggregate([
        {
          $match: {
            status: { $in: IN_TRANSIT_STATUSES },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    const s = statusStats[0] || {
      total: 0,
      completed: 0,
      cancelled: 0,
      rescheduled: 0,
      totalRescheduleCount: 0,
      onTimeScheduled: 0,
      onTimeArrived: 0,
      onTimeCompleted: 0,
      scheduledCount: 0,
      arrivedCount: 0,
      completedCount: 0,
    };

    const r = ratingStats[0] || { avgRating: 0, reviewCount: 0 };
    const t = todayStats[0] || { count: 0 };
    const it = inTransitStats[0] || { count: 0 };

    const calcOnTimeRate = (onTime: number, total: number) =>
      total > 0 ? Number(((onTime / total) * 100).toFixed(2)) : 0;

    const overallOnTimeNodes = s.scheduledCount + s.arrivedCount + s.completedCount;
    const overallOnTimeValues = s.onTimeScheduled + s.onTimeArrived + s.onTimeCompleted;

    const result = {
      totalOrders: s.total,
      completedOrders: s.completed,
      cancelledOrders: s.cancelled,
      rescheduledOrders: s.rescheduled,
      totalRescheduleTimes: s.totalRescheduleCount,
      overallOnTimeRate: calcOnTimeRate(overallOnTimeValues, overallOnTimeNodes),
      onTimeRateBreakdown: {
        scheduled: calcOnTimeRate(s.onTimeScheduled, s.scheduledCount),
        arrived: calcOnTimeRate(s.onTimeArrived, s.arrivedCount),
        completed: calcOnTimeRate(s.onTimeCompleted, s.completedCount),
      },
      averageRating: Number((r.avgRating || 0).toFixed(2)),
      reviewCount: r.reviewCount,
      todayOrders: t.count,
      inTransitOrders: it.count,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getOntimeAnalysis(
    groupBy: GroupByType,
    startDate?: string,
    endDate?: string,
    communities: string[] = [],
  ): Promise<any> {
    const { start, end } = this.parseDateRange(startDate, endDate);
    const cacheKey = this.generateCacheKey('ontime', {
      groupBy,
      start: start.toISOString(),
      end: end.toISOString(),
      communities,
    });
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const dateFilter = this.getDateRangeFilter(start, end);
    const { prevStart, prevEnd } = this.getPreviousDateRange(start, end);

    const baseMatch: Record<string, any> = { ...dateFilter };
    if (communities.length > 0) {
      baseMatch.community = { $in: communities };
    }

    const buildGroupStage = (prefix = ''): Record<string, any> => {
      const group: Record<string, any> = {
        _id: null,
      };

      switch (groupBy) {
        case 'community':
          group._id = { community: `$${prefix}community` };
          break;
        case 'date':
          group._id = {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: `$${prefix}scheduledAt`,
                timezone: '+08:00',
              },
            },
          };
          break;
        case 'reason':
          group._id = { reason: `$${prefix}supplyDemandReason` };
          break;
        case 'all':
        default:
          group._id = 'all';
          break;
      }

      return group;
    };

    const groupFields: Record<string, any> = {
      total: { $sum: 1 },
      onTimeScheduled: { $sum: { $cond: ['$onTimeRecord.scheduled', 1, 0] } },
      onTimeArrived: { $sum: { $cond: ['$onTimeRecord.arrived', 1, 0] } },
      onTimeCompleted: { $sum: { $cond: ['$onTimeRecord.completed', 1, 0] } },
      scheduledCount: { $sum: { $cond: [{ $ne: ['$onTimeRecord.scheduled', undefined] }, 1, 0] } },
      arrivedCount: { $sum: { $cond: [{ $ne: ['$actualArrivedAt', undefined] }, 1, 0] } },
      completedCount: { $sum: { $cond: [{ $ne: ['$actualCompletedAt', undefined] }, 1, 0] } },
    };

    const buildPipeline = (matchFilter: Record<string, any>): PipelineStage[] => {
      const groupStage = buildGroupStage();
      Object.assign(groupStage, groupFields);
      return [
        { $match: matchFilter },
        { $group: groupStage },
        { $sort: { '_id.date': 1, '_id.community': 1, '_id.reason': 1 } as any },
      ];
    };

    const prevMatch: Record<string, any> = {
      scheduledAt: { $gte: prevStart, $lt: prevEnd },
    };
    if (communities.length > 0) {
      prevMatch.community = { $in: communities };
    }

    const [currentData, prevData] = await Promise.all([
      this.orderModel.aggregate(buildPipeline(baseMatch)).exec(),
      this.orderModel.aggregate(buildPipeline(prevMatch)).exec(),
    ]);

    const processItem = (item: any) => {
      const calcRate = (onTime: number, total: number) =>
        total > 0 ? Number(((onTime / total) * 100).toFixed(2)) : 0;

      const totalNodes = item.scheduledCount + item.arrivedCount + item.completedCount;
      const totalOnTime = item.onTimeScheduled + item.onTimeArrived + item.onTimeCompleted;
      const overallOnTimeRate = calcRate(totalOnTime, totalNodes);

      const lateCount = item.completedCount > 0
        ? item.completedCount - item.onTimeCompleted
        : (item.total - (item.onTimeScheduled + item.onTimeArrived + item.onTimeCompleted));

      return {
        group: item._id === 'all'
          ? { all: true }
          : item._id,
        total: item.total,
        onTimeCount: totalOnTime,
        lateCount: Math.max(0, lateCount),
        onTimeRate: overallOnTimeRate,
        nodeBreakdown: {
          scheduled: {
            total: item.scheduledCount,
            onTime: item.onTimeScheduled,
            onTimeRate: calcRate(item.onTimeScheduled, item.scheduledCount),
          },
          arrived: {
            total: item.arrivedCount,
            onTime: item.onTimeArrived,
            onTimeRate: calcRate(item.onTimeArrived, item.arrivedCount),
          },
          completed: {
            total: item.completedCount,
            onTime: item.onTimeCompleted,
            onTimeRate: calcRate(item.onTimeCompleted, item.completedCount),
          },
        },
      };
    };

    const calcDiff = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(2));
    };

    const prevMap = new Map();
    prevData.forEach((item) => {
      const processed = processItem(item);
      const key = JSON.stringify(processed.group);
      prevMap.set(key, processed);
    });

    const groups = currentData.map((item) => {
      const processed = processItem(item);
      const key = JSON.stringify(processed.group);
      const prev = prevMap.get(key);

      return {
        ...processed,
        compare: prev
          ? {
              totalDiff: processed.total - prev.total,
              totalDiffRate: calcDiff(processed.total, prev.total),
              onTimeRateDiff: Number((processed.onTimeRate - prev.onTimeRate).toFixed(2)),
              lateCountDiff: processed.lateCount - prev.lateCount,
            }
          : {
              totalDiff: processed.total,
              totalDiffRate: processed.total > 0 ? 100 : 0,
              onTimeRateDiff: processed.onTimeRate,
              lateCountDiff: processed.lateCount,
            },
      };
    });

    const totalCurrent = groups.reduce((sum, g) => sum + g.total, 0);
    const totalPrev = prevData.reduce((sum, g) => sum + g.total, 0);
    const avgOnTimeCurrent = groups.length > 0
      ? groups.reduce((sum, g) => sum + g.onTimeRate, 0) / groups.length
      : 0;

    const result = {
      summary: {
        totalGroups: groups.length,
        totalOrders: totalCurrent,
        avgOnTimeRate: Number(avgOnTimeCurrent.toFixed(2)),
        totalCompare: {
          totalDiff: totalCurrent - totalPrev,
          totalDiffRate: calcDiff(totalCurrent, totalPrev),
        },
      },
      groups,
      dateRange: {
        current: { start: start.toISOString(), end: end.toISOString() },
        previous: { start: prevStart.toISOString(), end: prevEnd.toISOString() },
      },
      groupBy,
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getRegionDemand(
    startDate?: string,
    endDate?: string,
    communities: string[] = [],
    categories: string[] = [],
  ): Promise<any> {
    const { start, end } = this.parseDateRange(startDate, endDate);
    const cacheKey = this.generateCacheKey('region-demand', {
      start: start.toISOString(),
      end: end.toISOString(),
      communities,
      categories,
    });
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const dateFilter = this.getDateRangeFilter(start, end);
    const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));

    const matchFilter: Record<string, any> = { ...dateFilter };
    if (communities.length > 0) {
      matchFilter.community = { $in: communities };
    }

    const serviceLookupMatch: Record<string, any> = {};
    if (categories.length > 0) {
      serviceLookupMatch.category = { $in: categories };
    }

    const ordersPipeline: PipelineStage[] = [
      { $match: matchFilter },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service',
          pipeline: Object.keys(serviceLookupMatch).length > 0
            ? [{ $match: serviceLookupMatch }]
            : undefined,
        } as any,
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      {
        $match: categories.length > 0
          ? { 'service.category': { $exists: true } }
          : {},
      },
      {
        $addFields: {
          timeSlot: {
            $let: {
              vars: {
                hour: { $hour: { date: '$scheduledAt', timezone: '+08:00' } },
              },
              in: {
                $switch: {
                  branches: [
                    { case: { $and: [{ $gte: ['$$hour', 8] }, { $lt: ['$$hour', 12] }] }, then: 'morning' },
                    { case: { $and: [{ $gte: ['$$hour', 12] }, { $lt: ['$$hour', 18] }] }, then: 'afternoon' },
                    { case: { $and: [{ $gte: ['$$hour', 18] }, { $lt: ['$$hour', 22] }] }, then: 'evening' },
                  ],
                  default: 'other',
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            community: '$community',
            category: { $ifNull: ['$service.category', 'unknown'] },
            timeSlot: '$timeSlot',
          },
          orderCount: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
      {
        $sort: {
          '_id.community': 1,
          '_id.category': 1,
          '_id.timeSlot': 1,
        },
      },
    ];

    const workerMatch: Record<string, any> = { status: 'on' };
    if (communities.length > 0) {
      workerMatch.community = { $in: communities };
    }

    const [orderData, workerData] = await Promise.all([
      this.orderModel.aggregate(ordersPipeline).exec(),
      this.workerModel.aggregate([
        { $match: workerMatch },
        {
          $group: {
            _id: {
              community: '$community',
            },
            workerCount: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    const workerMap = new Map<string, number>();
    workerData.forEach((w) => {
      const key = w._id.community || 'unknown';
      workerMap.set(key, (workerMap.get(key) || 0) + w.workerCount);
    });

    const communitySummary = new Map<string, any>();
    const categorySummary = new Map<string, any>();
    const timeSlotSummary = new Map<string, any>();

    const details = orderData.map((item) => {
      const community = item._id.community || 'unknown';
      const category = item._id.category || 'unknown';
      const timeSlot = item._id.timeSlot || 'other';
      const availableWorkers = workerMap.get(community) || 0;
      const supplyCapacity = availableWorkers * ORDERS_PER_DAY_PER_WORKER * daysDiff;
      const demandGap = item.orderCount - supplyCapacity;

      const incSummary = (map: Map<string, any>, key: string, data: any) => {
        const existing = map.get(key) || { orderCount: 0, completedCount: 0, cancelledCount: 0 };
        existing.orderCount += data.orderCount;
        existing.completedCount += data.completedCount;
        existing.cancelledCount += data.cancelledCount;
        map.set(key, existing);
      };

      incSummary(communitySummary, community, item);
      incSummary(categorySummary, category, item);
      incSummary(timeSlotSummary, timeSlot, item);

      return {
        community,
        category,
        timeSlot,
        orderCount: item.orderCount,
        completedCount: item.completedCount,
        cancelledCount: item.cancelledCount,
        completionRate: item.orderCount > 0
          ? Number(((item.completedCount / item.orderCount) * 100).toFixed(2))
          : 0,
        availableWorkers,
        supplyCapacity,
        demandGap,
        demandGapStatus: demandGap > 0 ? 'deficit' : demandGap === 0 ? 'balanced' : 'surplus',
      };
    });

    const toArrayWithGaps = (map: Map<string, any>) => {
      return Array.from(map.entries()).map(([key, value]: [string, any]) => {
        const availableWorkers = key !== 'other' && !Array.from(workerMap.keys()).includes(key)
          ? 0
          : (workerMap.get(key) || 0);
        const supplyCapacity = availableWorkers * ORDERS_PER_DAY_PER_WORKER * daysDiff;
        const demandGap = value.orderCount - supplyCapacity;
        return {
          name: key,
          orderCount: value.orderCount,
          completedCount: value.completedCount,
          cancelledCount: value.cancelledCount,
          completionRate: value.orderCount > 0
            ? Number(((value.completedCount / value.orderCount) * 100).toFixed(2))
            : 0,
          availableWorkers,
          supplyCapacity,
          demandGap,
          demandGapStatus: demandGap > 0 ? 'deficit' : demandGap === 0 ? 'balanced' : 'surplus',
        };
      });
    };

    const totalOrders = details.reduce((s, d) => s + d.orderCount, 0);
    const totalWorkers = workerData.reduce((s, w) => s + w.workerCount, 0);
    const totalCapacity = totalWorkers * ORDERS_PER_DAY_PER_WORKER * daysDiff;

    const result = {
      summary: {
        totalOrders,
        totalCapacity,
        totalDemandGap: totalOrders - totalCapacity,
        totalAvailableWorkers: totalWorkers,
        daysCovered: daysDiff,
        deficitCommunities: toArrayWithGaps(communitySummary).filter((c) => c.demandGap > 0).length,
      },
      byCommunity: toArrayWithGaps(communitySummary).sort((a, b) => b.demandGap - a.demandGap),
      byCategory: toArrayWithGaps(categorySummary).sort((a, b) => b.orderCount - a.orderCount),
      byTimeSlot: toArrayWithGaps(timeSlotSummary).sort((a, b) => b.orderCount - a.orderCount),
      details: details.sort((a, b) => b.orderCount - a.orderCount),
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getTrend(
    granularity: TrendGranularity = 'day',
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const { start, end } = this.parseDateRange(startDate, endDate);
    const cacheKey = this.generateCacheKey('trend', {
      granularity,
      start: start.toISOString(),
      end: end.toISOString(),
    });
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const dateFilter = this.getDateRangeFilter(start, end);

    const buildDateId = (): Record<string, any> => {
      const tz = '+08:00';
      switch (granularity) {
        case 'week':
          return {
            year: { $year: { date: '$scheduledAt', timezone: tz } },
            week: { $isoWeek: { date: '$scheduledAt', timezone: tz } },
          };
        case 'month':
          return {
            year: { $year: { date: '$scheduledAt', timezone: tz } },
            month: { $month: { date: '$scheduledAt', timezone: tz } },
          };
        case 'day':
        default:
          return {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$scheduledAt',
                timezone: tz,
              },
            },
          };
      }
    };

    const formatLabel = (id: any): string => {
      switch (granularity) {
        case 'week':
          return `${id.year}-W${String(id.week).padStart(2, '0')}`;
        case 'month':
          return `${id.year}-${String(id.month).padStart(2, '0')}`;
        case 'day':
        default:
          return id.date;
      }
    };

    const ordersPipeline: PipelineStage[] = [
      { $match: dateFilter },
      {
        $group: {
          _id: buildDateId(),
          orderCount: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          rescheduledCount: { $sum: { $cond: [{ $eq: ['$status', 'rescheduled'] }, 1, 0] } },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$price',
                0,
              ],
            },
          },
          totalRevenue: { $sum: '$price' },
          onTimeScheduled: { $sum: { $cond: ['$onTimeRecord.scheduled', 1, 0] } },
          onTimeArrived: { $sum: { $cond: ['$onTimeRecord.arrived', 1, 0] } },
          onTimeCompleted: { $sum: { $cond: ['$onTimeRecord.completed', 1, 0] } },
          scheduledCount: { $sum: { $cond: [{ $ne: ['$onTimeRecord.scheduled', undefined] }, 1, 0] } },
          arrivedCount: { $sum: { $cond: [{ $ne: ['$actualArrivedAt', undefined] }, 1, 0] } },
          completedFulfillCount: { $sum: { $cond: [{ $ne: ['$actualCompletedAt', undefined] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const [orderTrend, ratingTrend] = await Promise.all([
      this.orderModel.aggregate(ordersPipeline).exec(),
      this.reviewModel.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order',
          },
        },
        { $unwind: '$order' },
        { $match: { 'order.scheduledAt': dateFilter.scheduledAt } },
        {
          $addFields: {
            scheduledAt: '$order.scheduledAt',
          },
        },
        {
          $group: {
            _id: buildDateId(),
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    const ratingMap = new Map<string, { avgRating: number; reviewCount: number }>();
    ratingTrend.forEach((item) => {
      ratingMap.set(formatLabel(item._id), {
        avgRating: Number((item.avgRating || 0).toFixed(2)),
        reviewCount: item.reviewCount,
      });
    });

    const dataPoints = orderTrend.map((item) => {
      const label = formatLabel(item._id);
      const totalNodes = item.scheduledCount + item.arrivedCount + item.completedFulfillCount;
      const totalOnTime = item.onTimeScheduled + item.onTimeArrived + item.onTimeCompleted;
      const onTimeRate = totalNodes > 0
        ? Number(((totalOnTime / totalNodes) * 100).toFixed(2))
        : 0;
      const ratingInfo = ratingMap.get(label) || { avgRating: 0, reviewCount: 0 };

      return {
        label,
        orderCount: item.orderCount,
        completedCount: item.completedCount,
        cancelledCount: item.cancelledCount,
        rescheduledCount: item.rescheduledCount,
        completionRate: item.orderCount > 0
          ? Number(((item.completedCount / item.orderCount) * 100).toFixed(2))
          : 0,
        revenue: Number(item.revenue.toFixed(2)),
        totalRevenue: Number(item.totalRevenue.toFixed(2)),
        onTimeRate,
        averageRating: ratingInfo.avgRating,
        reviewCount: ratingInfo.reviewCount,
      };
    });

    const calcGrowth = (arr: any[], key: string) => {
      if (arr.length < 2) return 0;
      const prev = arr[arr.length - 2][key] || 1;
      const curr = arr[arr.length - 1][key];
      return Number((((curr - prev) / prev) * 100).toFixed(2));
    };

    const result = {
      granularity,
      summary: {
        totalOrders: dataPoints.reduce((s, d) => s + d.orderCount, 0),
        totalRevenue: Number(dataPoints.reduce((s, d) => s + d.revenue, 0).toFixed(2)),
        avgOnTimeRate: dataPoints.length > 0
          ? Number(
              (dataPoints.reduce((s, d) => s + d.onTimeRate, 0) / dataPoints.length).toFixed(2),
            )
          : 0,
        avgCompletionRate: dataPoints.length > 0
          ? Number(
              (dataPoints.reduce((s, d) => s + d.completionRate, 0) / dataPoints.length).toFixed(2),
            )
          : 0,
        periodGrowth: {
          orderGrowth: calcGrowth(dataPoints, 'orderCount'),
          revenueGrowth: calcGrowth(dataPoints, 'revenue'),
          onTimeRateDiff: dataPoints.length >= 2
            ? Number((dataPoints[dataPoints.length - 1].onTimeRate - dataPoints[dataPoints.length - 2].onTimeRate).toFixed(2))
            : 0,
        },
      },
      dataPoints,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getWorkerPerformance(
    startDate?: string,
    endDate?: string,
    sortBy: 'completed' | 'onTimeRate' | 'rating' | 'reschedule' = 'completed',
    page: number = 1,
    pageSize: number = 20,
  ): Promise<any> {
    const { start, end } = this.parseDateRange(startDate, endDate);
    const cacheKey = this.generateCacheKey('workers', {
      start: start.toISOString(),
      end: end.toISOString(),
      sortBy,
      page,
      pageSize,
    });
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const dateFilter = this.getDateRangeFilter(start, end);

    const ordersPipeline: PipelineStage[] = [
      {
        $match: {
          ...dateFilter,
          workerId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$workerId',
          totalAssigned: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          rescheduledCount: { $sum: { $cond: [{ $eq: ['$status', 'rescheduled'] }, 1, 0] } },
          totalRescheduleTimes: { $sum: { $ifNull: ['$rescheduleCount', 0] } },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0],
            },
          },
          onTimeScheduled: { $sum: { $cond: ['$onTimeRecord.scheduled', 1, 0] } },
          onTimeArrived: { $sum: { $cond: ['$onTimeRecord.arrived', 1, 0] } },
          onTimeCompleted: { $sum: { $cond: ['$onTimeRecord.completed', 1, 0] } },
          scheduledCount: { $sum: { $cond: [{ $ne: ['$onTimeRecord.scheduled', undefined] }, 1, 0] } },
          arrivedCount: { $sum: { $cond: [{ $ne: ['$actualArrivedAt', undefined] }, 1, 0] } },
          completedFulfillCount: { $sum: { $cond: [{ $ne: ['$actualCompletedAt', undefined] }, 1, 0] } },
        },
      },
    ];

    const reviewsPipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      {
        $match: {
          'order.scheduledAt': dateFilter.scheduledAt,
          'order.workerId': { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$order.workerId',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          twoStar: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          fiveStar: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        },
      },
    ];

    const [orderStats, reviewStats, totalWorkers] = await Promise.all([
      this.orderModel.aggregate(ordersPipeline).exec(),
      this.reviewModel.aggregate(reviewsPipeline).exec(),
      this.workerModel.countDocuments({}),
    ]);

    const reviewMap = new Map<string, any>();
    reviewStats.forEach((r) => {
      reviewMap.set(r._id.toString(), {
        avgRating: Number((r.avgRating || 0).toFixed(2)),
        reviewCount: r.reviewCount,
        ratingDistribution: {
          1: r.oneStar,
          2: r.twoStar,
          3: r.threeStar,
          4: r.fourStar,
          5: r.fiveStar,
        },
      });
    });

    const orderMap = new Map<string, any>();
    orderStats.forEach((o) => {
      orderMap.set(o._id.toString(), o);
    });

    const workerIds = new Set([...orderMap.keys(), ...reviewMap.keys()]);

    const workers = await this.workerModel
      .find({ _id: { $in: Array.from(workerIds).map((id) => new Types.ObjectId(id)) } })
      .select('_id name phone status community rating skills hireDate')
      .exec();

    const performanceList = workers.map((worker) => {
      const os = orderMap.get(worker._id.toString()) || {
        totalAssigned: 0,
        completedCount: 0,
        cancelledCount: 0,
        rescheduledCount: 0,
        totalRescheduleTimes: 0,
        totalRevenue: 0,
        onTimeScheduled: 0,
        onTimeArrived: 0,
        onTimeCompleted: 0,
        scheduledCount: 0,
        arrivedCount: 0,
        completedFulfillCount: 0,
      };
      const rs = reviewMap.get(worker._id.toString()) || {
        avgRating: worker.rating || 0,
        reviewCount: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };

      const totalNodes = os.scheduledCount + os.arrivedCount + os.completedFulfillCount;
      const totalOnTime = os.onTimeScheduled + os.onTimeArrived + os.onTimeCompleted;
      const onTimeRate = totalNodes > 0
        ? Number(((totalOnTime / totalNodes) * 100).toFixed(2))
        : 0;

      return {
        workerId: worker._id,
        name: worker.name,
        phone: worker.phone,
        status: worker.status,
        community: worker.community,
        profileRating: worker.rating,
        skills: worker.skills,
        hireDate: worker.hireDate,
        stats: {
          totalAssigned: os.totalAssigned,
          completedCount: os.completedCount,
          cancelledCount: os.cancelledCount,
          rescheduledCount: os.rescheduledCount,
          totalRescheduleTimes: os.totalRescheduleTimes,
          totalRevenue: Number((os.totalRevenue || 0).toFixed(2)),
          onTimeRate,
          completionRate: os.totalAssigned > 0
            ? Number(((os.completedCount / os.totalAssigned) * 100).toFixed(2))
            : 0,
          onTimeBreakdown: {
            scheduled: os.scheduledCount > 0
              ? Number(((os.onTimeScheduled / os.scheduledCount) * 100).toFixed(2))
              : 0,
            arrived: os.arrivedCount > 0
              ? Number(((os.onTimeArrived / os.arrivedCount) * 100).toFixed(2))
              : 0,
            completed: os.completedFulfillCount > 0
              ? Number(((os.onTimeCompleted / os.completedFulfillCount) * 100).toFixed(2))
              : 0,
          },
          rating: rs.avgRating,
          reviewCount: rs.reviewCount,
          ratingDistribution: rs.ratingDistribution,
        },
      };
    });

    const sortKeyMap: Record<string, string> = {
      completed: 'stats.completedCount',
      onTimeRate: 'stats.onTimeRate',
      rating: 'stats.rating',
      reschedule: 'stats.totalRescheduleTimes',
    };

    const sortKey = sortKeyMap[sortBy] || 'stats.completedCount';
    const getSortValue = (item: any, key: string): number => {
      const parts = key.split('.');
      let val: any = item;
      for (const p of parts) val = val?.[p];
      return Number(val) || 0;
    };

    performanceList.sort((a, b) => {
      const diff = getSortValue(b, sortKey) - getSortValue(a, sortKey);
      if (diff !== 0) return diff;
      return b.stats.completedCount - a.stats.completedCount;
    });

    performanceList.forEach((item, index) => {
      (item as any).ranking = index + 1;
    });

    const total = performanceList.length;
    const skip = (page - 1) * pageSize;
    const pagedList = performanceList.slice(skip, skip + pageSize);

    const completedRanking = [...performanceList]
      .sort((a, b) => b.stats.completedCount - a.stats.completedCount)
      .map((item, i) => ({ workerId: item.workerId.toString(), rank: i + 1 }));
    const ratingRanking = [...performanceList]
      .sort((a, b) => b.stats.rating - a.stats.rating)
      .map((item, i) => ({ workerId: item.workerId.toString(), rank: i + 1 }));
    const rescheduleRanking = [...performanceList]
      .sort((a, b) => b.stats.totalRescheduleTimes - a.stats.totalRescheduleTimes)
      .map((item, i) => ({ workerId: item.workerId.toString(), rank: i + 1 }));
    const onTimeRanking = [...performanceList]
      .sort((a, b) => b.stats.onTimeRate - a.stats.onTimeRate)
      .map((item, i) => ({ workerId: item.workerId.toString(), rank: i + 1 }));

    const pagedWithRanks = pagedList.map((item) => {
      const wid = item.workerId.toString();
      return {
        ...item,
        rankings: {
          completedRank: completedRanking.find((r) => r.workerId === wid)?.rank || 0,
          ratingRank: ratingRanking.find((r) => r.workerId === wid)?.rank || 0,
          rescheduleRank: rescheduleRanking.find((r) => r.workerId === wid)?.rank || 0,
          onTimeRank: onTimeRanking.find((r) => r.workerId === wid)?.rank || 0,
        },
      };
    });

    const avgStats = performanceList.length > 0
      ? {
          avgCompleted: Number(
            (performanceList.reduce((s, i) => s + i.stats.completedCount, 0) / total).toFixed(2),
          ),
          avgOnTimeRate: Number(
            (performanceList.reduce((s, i) => s + i.stats.onTimeRate, 0) / total).toFixed(2),
          ),
          avgRating: Number(
            (performanceList.reduce((s, i) => s + i.stats.rating, 0) / total).toFixed(2),
          ),
          totalRevenue: Number(
            performanceList.reduce((s, i) => s + i.stats.totalRevenue, 0).toFixed(2),
          ),
        }
      : {
          avgCompleted: 0,
          avgOnTimeRate: 0,
          avgRating: 0,
          totalRevenue: 0,
        };

    const result = {
      summary: {
        ...avgStats,
        activeWorkers: total,
        totalWorkers,
        activeRate: totalWorkers > 0 ? Number(((total / totalWorkers) * 100).toFixed(2)) : 0,
      },
      topRankings: {
        byCompleted: completedRanking.slice(0, 10).map((r) => {
          const worker = performanceList.find((w) => w.workerId.toString() === r.workerId);
          return {
            rank: r.rank,
            workerId: r.workerId,
            name: worker?.name,
            value: worker?.stats.completedCount || 0,
          };
        }),
        byRating: ratingRanking.slice(0, 10).map((r) => {
          const worker = performanceList.find((w) => w.workerId.toString() === r.workerId);
          return {
            rank: r.rank,
            workerId: r.workerId,
            name: worker?.name,
            value: worker?.stats.rating || 0,
          };
        }),
        byReschedule: rescheduleRanking.slice(0, 10).map((r) => {
          const worker = performanceList.find((w) => w.workerId.toString() === r.workerId);
          return {
            rank: r.rank,
            workerId: r.workerId,
            name: worker?.name,
            value: worker?.stats.totalRescheduleTimes || 0,
          };
        }),
        byOnTime: onTimeRanking.slice(0, 10).map((r) => {
          const worker = performanceList.find((w) => w.workerId.toString() === r.workerId);
          return {
            rank: r.rank,
            workerId: r.workerId,
            name: worker?.name,
            value: worker?.stats.onTimeRate || 0,
          };
        }),
      },
      list: pagedWithRanks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      sortBy,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL);
    return result;
  }
}
