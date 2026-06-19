import type {
  PaymentCallback,
  PaginationResult,
  PaymentCallbackStatus,
  RiskLevel,
  RiskStatistics,
} from '@seat-platform/shared';
import { PaymentCallbackModel, type IPaymentCallbackDocument } from '../models/PaymentCallback';
import { SeatModel } from '../models/Seat';
import { createAuditLog } from '../models/AuditLog';
import { generateId, nowISO } from '../utils';

export interface UpdatePaymentCallbackInput {
  callbackStatus?: PaymentCallbackStatus;
  remark?: string;
  resolution?: string;
  riskLevel?: RiskLevel;
  resolvedBy?: string;
}

export interface ListPaymentCallbacksQuery {
  page: number;
  pageSize: number;
  callbackStatus?: PaymentCallbackStatus;
  riskLevel?: RiskLevel;
  seatId?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

function toPaymentCallback(doc: IPaymentCallbackDocument): PaymentCallback {
  return doc.toJSON() as unknown as PaymentCallback;
}

function autoRiskLevel(status: PaymentCallbackStatus, retryCount: number): RiskLevel {
  if (status === 'success' || status === 'resolved') return 'low';
  if (retryCount >= 5) return 'critical';
  if (retryCount >= 3) return 'high';
  if (retryCount >= 1) return 'medium';
  return 'medium';
}

export async function recordPaymentCallback(params: {
  seatId?: string;
  seatCode: string;
  transactionId: string;
  amount: number;
  currency?: string;
  callbackStatus: PaymentCallbackStatus;
  rawPayload: Record<string, unknown>;
  errorMessage?: string;
}): Promise<PaymentCallback> {
  let seat = null;
  if (params.seatId) {
    seat = await SeatModel.findById(params.seatId);
  } else if (params.seatCode) {
    seat = await SeatModel.findOne({ seatCode: params.seatCode });
  }

  const seatId = params.seatId || seat?._id || '';
  const seatCode = params.seatCode || seat?.seatCode || '';
  const customerName = seat?.customerName || '';

  const record = new PaymentCallbackModel({
    _id: generateId('pay_'),
    seatId,
    seatCode,
    customerName,
    transactionId: params.transactionId,
    amount: params.amount,
    currency: params.currency || 'CNY',
    callbackStatus: params.callbackStatus,
    rawPayload: params.rawPayload,
    errorMessage: params.errorMessage,
    retryCount: 0,
    riskLevel: autoRiskLevel(params.callbackStatus, 0),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  });
  await record.save();

  await createAuditLog({
    entityType: 'payment',
    entityId: record._id,
    action: 'payment.callback',
    newValue: {
      transactionId: params.transactionId,
      status: params.callbackStatus,
      amount: params.amount,
    },
    operatorName: 'payment-gateway',
  });

  return toPaymentCallback(record);
}

export async function updatePaymentCallback(
  id: string,
  input: UpdatePaymentCallbackInput,
  operatorName = 'system'
): Promise<PaymentCallback | null> {
  const record = await PaymentCallbackModel.findById(id);
  if (!record) return null;

  const oldStatus = record.callbackStatus;
  const oldRisk = record.riskLevel;

  if (input.callbackStatus !== undefined) record.callbackStatus = input.callbackStatus;
  if (input.remark !== undefined) record.remark = input.remark;
  if (input.resolution !== undefined) record.resolution = input.resolution;
  if (input.riskLevel !== undefined) record.riskLevel = input.riskLevel;
  if (input.resolvedBy !== undefined) record.resolvedBy = input.resolvedBy;

  if (input.callbackStatus === 'resolved' && !record.resolvedAt) {
    record.resolvedAt = nowISO();
  }
  if (!input.riskLevel && input.callbackStatus) {
    record.riskLevel = autoRiskLevel(record.callbackStatus, record.retryCount);
  }
  record.updatedAt = nowISO();
  await record.save();

  if (oldStatus !== record.callbackStatus || oldRisk !== record.riskLevel) {
    await createAuditLog({
      entityType: 'payment',
      entityId: id,
      action: 'payment.callback_resolve',
      fieldName: 'callbackStatus',
      oldValue: oldStatus,
      newValue: record.callbackStatus,
      remark: input.remark || input.resolution,
      operatorName,
    });
  }

  return toPaymentCallback(record);
}

export async function retryPaymentCallback(
  id: string,
  remark?: string,
  operatorName = 'system'
): Promise<PaymentCallback | null> {
  const record = await PaymentCallbackModel.findById(id);
  if (!record) return null;

  record.retryCount += 1;
  record.lastRetryAt = nowISO();
  record.callbackStatus = 'retrying';
  record.riskLevel = autoRiskLevel(record.callbackStatus, record.retryCount);
  if (remark) record.remark = remark;
  record.updatedAt = nowISO();
  await record.save();

  await createAuditLog({
    entityType: 'payment',
    entityId: id,
    action: 'payment.callback_retry',
    oldValue: { retryCount: record.retryCount - 1 },
    newValue: { retryCount: record.retryCount },
    remark,
    operatorName,
  });

  return toPaymentCallback(record);
}

export async function listPaymentCallbacks(
  query: ListPaymentCallbacksQuery
): Promise<PaginationResult<PaymentCallback>> {
  const { page, pageSize, callbackStatus, riskLevel, seatId, keyword, startDate, endDate } = query;
  const filter: Record<string, unknown> = {};

  if (callbackStatus) filter.callbackStatus = callbackStatus;
  if (riskLevel) filter.riskLevel = riskLevel;
  if (seatId) filter.seatId = seatId;
  if (keyword) {
    filter.$or = [
      { transactionId: { $regex: keyword, $options: 'i' } },
      { seatCode: { $regex: keyword, $options: 'i' } },
      { customerName: { $regex: keyword, $options: 'i' } },
    ];
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as Record<string, unknown>).$gte = startDate;
    if (endDate) (filter.createdAt as Record<string, unknown>).$lte = endDate;
  }

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    PaymentCallbackModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
    PaymentCallbackModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(toPaymentCallback),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPaymentCallbackById(id: string): Promise<PaymentCallback | null> {
  const doc = await PaymentCallbackModel.findById(id);
  return doc ? toPaymentCallback(doc) : null;
}

export async function getRiskStatistics(): Promise<RiskStatistics> {
  const stats = await PaymentCallbackModel.aggregate<{
    totalFailedCallbacks: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    unresolvedCount: number;
  }>([
    {
      $facet: {
        all: [
          {
            $match: {
              callbackStatus: { $in: ['failed', 'retrying', 'pending'] },
            },
          },
          { $count: 'count' },
        ],
        high: [{ $match: { riskLevel: 'high' } }, { $count: 'count' }],
        medium: [{ $match: { riskLevel: 'medium' } }, { $count: 'count' }],
        low: [{ $match: { riskLevel: 'low' } }, { $count: 'count' }],
        unresolved: [
          {
            $match: {
              callbackStatus: { $in: ['failed', 'retrying', 'pending'] },
              resolvedAt: { $exists: false },
            },
          },
          { $count: 'count' },
        ],
      },
    },
    {
      $project: {
        totalFailedCallbacks: { $arrayElemAt: ['$all.count', 0] },
        highRiskCount: { $arrayElemAt: ['$high.count', 0] },
        mediumRiskCount: { $arrayElemAt: ['$medium.count', 0] },
        lowRiskCount: { $arrayElemAt: ['$low.count', 0] },
        unresolvedCount: { $arrayElemAt: ['$unresolved.count', 0] },
      },
    },
  ]).exec();

  const result = stats[0] || {};
  return {
    totalFailedCallbacks: result.totalFailedCallbacks || 0,
    highRiskCount: result.highRiskCount || 0,
    mediumRiskCount: result.mediumRiskCount || 0,
    lowRiskCount: result.lowRiskCount || 0,
    unresolvedCount: result.unresolvedCount || 0,
  };
}
