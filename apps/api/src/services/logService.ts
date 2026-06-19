import type { AuditLog, PaginationResult, OperationLog, OperationAction } from '@seat-platform/shared';
import { AuditLogModel, type IAuditLogDocument } from '../models/AuditLog';
import { OperationLogModel, type IOperationLogDocument } from '../models/OperationLog';

export interface ListAuditLogsQuery {
  page: number;
  pageSize: number;
  entityType?: AuditLog['entityType'];
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListOperationLogsQuery {
  page: number;
  pageSize: number;
  userId?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

function toAuditLog(doc: IAuditLogDocument): AuditLog {
  return doc.toJSON() as unknown as AuditLog;
}

function toOperationLog(doc: IOperationLogDocument): OperationLog {
  return doc.toJSON() as unknown as OperationLog;
}

export async function listAuditLogs(
  query: ListAuditLogsQuery
): Promise<PaginationResult<AuditLog>> {
  const { page, pageSize, entityType, entityId, action, startDate, endDate } = query;
  const filter: Record<string, unknown> = {};

  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;
  if (action) filter.action = action;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as Record<string, unknown>).$gte = startDate;
    if (endDate) (filter.createdAt as Record<string, unknown>).$lte = endDate;
  }

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
    AuditLogModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(toAuditLog),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function listOperationLogs(
  query: ListOperationLogsQuery
): Promise<PaginationResult<OperationLog>> {
  const { page, pageSize, userId, action, targetType, startDate, endDate } = query;
  const filter: Record<string, unknown> = {};

  if (userId) filter.userId = userId;
  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as Record<string, unknown>).$gte = startDate;
    if (endDate) (filter.createdAt as Record<string, unknown>).$lte = endDate;
  }

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    OperationLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
    OperationLogModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(toOperationLog),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
