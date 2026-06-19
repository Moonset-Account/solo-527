import type {
  UsageRecord,
  UsageTrendPoint,
  PaginationResult,
} from '@seat-platform/shared';
import { UsageRecordModel, type IUsageRecordDocument } from '../models/UsageRecord';
import { SeatModel } from '../models/Seat';
import { generateId } from '../utils';

export interface CreateUsageRecordInput {
  seatId?: string;
  seatCode: string;
  timestamp?: string;
  apiCalls: number;
  errorCount: number;
  avgLatency: number;
  endpoint?: string;
  statusCode?: number;
  rawData?: Record<string, unknown>;
}

export interface UsageTrendQuery {
  seatId?: string;
  startDate: string;
  endDate: string;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

function toUsageRecord(doc: IUsageRecordDocument): UsageRecord {
  return doc.toJSON() as unknown as UsageRecord;
}

export async function createUsageRecord(
  input: CreateUsageRecordInput
): Promise<UsageRecord> {
  let seatId = input.seatId;
  if (!seatId && input.seatCode) {
    const seat = await SeatModel.findOne({ seatCode: input.seatCode }).select('_id');
    if (seat) seatId = seat._id;
  }

  const record = new UsageRecordModel({
    _id: generateId('usage_'),
    seatId: seatId || '',
    seatCode: input.seatCode,
    timestamp: input.timestamp || new Date().toISOString(),
    apiCalls: input.apiCalls,
    errorCount: input.errorCount,
    avgLatency: input.avgLatency,
    endpoint: input.endpoint,
    statusCode: input.statusCode,
    rawData: input.rawData,
  });
  await record.save();

  if (seatId) {
    await SeatModel.findByIdAndUpdate(seatId, {
      $inc: { usedQuota: input.apiCalls },
    }).exec();
  }

  return toUsageRecord(record);
}

export async function listUsageRecords(
  seatId: string,
  page: number,
  pageSize: number,
  startDate?: string,
  endDate?: string
): Promise<PaginationResult<UsageRecord>> {
  const filter: Record<string, unknown> = { seatId };
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) (filter.timestamp as Record<string, unknown>).$gte = startDate;
    if (endDate) (filter.timestamp as Record<string, unknown>).$lte = endDate;
  }

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    UsageRecordModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(pageSize).exec(),
    UsageRecordModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(toUsageRecord),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUsageTrend(query: UsageTrendQuery): Promise<UsageTrendPoint[]> {
  const { seatId, startDate, endDate } = query;

  const match: Record<string, unknown> = {
    timestamp: { $gte: startDate, $lte: endDate },
  };
  if (seatId) match.seatId = seatId;

  const dateFormat = getDateFormatByGranularity(query.granularity);

  const results = await UsageRecordModel.aggregate<{
    _id: string;
    apiCalls: number;
    errorCount: number;
    avgLatency: number;
    count: number;
  }>([
    { $match: match },
    {
      $project: {
        timestamp: 1,
        apiCalls: 1,
        errorCount: 1,
        avgLatency: 1,
        dateKey: { $dateToString: { format: dateFormat, date: { $toDate: '$timestamp' } } },
      },
    },
    {
      $group: {
        _id: '$dateKey',
        apiCalls: { $sum: '$apiCalls' },
        errorCount: { $sum: '$errorCount' },
        totalLatency: { $sum: { $multiply: ['$avgLatency', '$apiCalls'] } },
        totalCalls: { $sum: '$apiCalls' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 1,
        apiCalls: 1,
        errorCount: 1,
        avgLatency: { $cond: [{ $eq: ['$totalCalls', 0] }, 0, { $divide: ['$totalLatency', '$totalCalls'] }] },
        count: 1,
      },
    },
    { $sort: { _id: 1 } },
  ]).exec();

  return results.map((r) => ({
    date: r._id,
    apiCalls: r.apiCalls,
    errorCount: r.errorCount,
    avgLatency: Math.round(r.avgLatency * 100) / 100,
  }));
}

function getDateFormatByGranularity(granularity: UsageTrendQuery['granularity']): string {
  switch (granularity) {
    case 'hour':
      return '%Y-%m-%dT%H:00:00';
    case 'day':
      return '%Y-%m-%d';
    case 'week':
      return '%Y-U%U';
    case 'month':
      return '%Y-%m';
    default:
      return '%Y-%m-%d';
  }
}

export async function listAbnormalRecords(
  page: number,
  pageSize: number,
  startDate?: string,
  endDate?: string,
  seatId?: string
): Promise<PaginationResult<UsageRecord>> {
  const filter: Record<string, unknown> = {
    $or: [{ errorCount: { $gt: 0 } }, { avgLatency: { $gt: 3000 } }],
  };
  if (seatId) filter.seatId = seatId;
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) (filter.timestamp as Record<string, unknown>).$gte = startDate;
    if (endDate) (filter.timestamp as Record<string, unknown>).$lte = endDate;
  }

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    UsageRecordModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(pageSize).exec(),
    UsageRecordModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(toUsageRecord),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
