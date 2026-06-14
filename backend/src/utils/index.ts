import type { Context } from 'hono';
import { db } from '../db';
import * as schema from '../db/schema';
import type { JwtPayload } from '../middleware/auth';

export function getPageParams(query: Record<string, string | undefined>) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || '20')));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function ok<T>(c: Context, data: T, extra: Record<string, unknown> = {}) {
  return c.json({ success: true, data, ...extra });
}

export function fail(c: Context, message: string, status = 400) {
  return c.json({ success: false, error: message }, status);
}

export async function createTimelineEvent(input: {
  workOrderId: number;
  processId?: number;
  reworkRecordId?: number;
  eventType: typeof schema.timelineEventTypeEnum.enumValues[number];
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  user: JwtPayload;
  eventAt?: Date;
}) {
  return db.insert(schema.timelineEvents).values({
    workOrderId: input.workOrderId,
    processId: input.processId,
    reworkRecordId: input.reworkRecordId,
    eventType: input.eventType,
    title: input.title,
    description: input.description,
    metadata: input.metadata,
    triggeredBy: input.user.sub,
    triggeredByName: input.user.realName,
    eventAt: input.eventAt || new Date(),
  });
}

export async function createActionLog(input: {
  logType: typeof schema.actionLogTypeEnum.enumValues[number];
  title: string;
  detail?: string;
  relatedWorkOrderId?: number;
  relatedProcessId?: number;
  relatedReworkId?: number;
  user: JwtPayload;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  return db.insert(schema.actionLogs).values({
    logType: input.logType,
    title: input.title,
    detail: input.detail,
    relatedWorkOrderId: input.relatedWorkOrderId,
    relatedProcessId: input.relatedProcessId,
    relatedReworkId: input.relatedReworkId,
    operatorId: input.user.sub,
    operatorName: input.user.realName,
    ipAddress: input.ipAddress,
    metadata: input.metadata,
  });
}

export async function createExportRecord(input: {
  exportType: typeof schema.exportTypeEnum.enumValues[number];
  fileName: string;
  filterConditions?: Record<string, unknown>;
  user: JwtPayload;
  fileSize?: number;
  fileUrl?: string;
  recordCount?: number;
  status?: string;
  completedAt?: Date;
}) {
  return db
    .insert(schema.exportRecords)
    .values({
      exportType: input.exportType,
      fileName: input.fileName,
      fileSize: input.fileSize,
      fileUrl: input.fileUrl,
      filterConditions: input.filterConditions,
      recordCount: input.recordCount,
      requestedBy: input.user.sub,
      requestedByName: input.user.realName,
      status: input.status || 'completed',
      completedAt: input.completedAt || new Date(),
    })
    .returning();
}

export function calcMaterialStatus(required: number, allocated: number, currentStock: number, reservedStock: number) {
  const available = currentStock - reservedStock;
  const shortage = required - allocated;
  if (shortage <= 0) return 'kitted';
  if (available >= shortage) return 'partial';
  return 'shortage';
}

export function calcDeliveryRisk(deliveryDate: Date | null, plannedEndDate: Date | null, status: string) {
  if (!deliveryDate) return 'low';
  const now = new Date();
  const daysToDelivery = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (status === 'completed') return 'low';
  if (daysToDelivery < 0) return 'critical';
  if (daysToDelivery <= 2) return 'high';
  if (plannedEndDate && plannedEndDate > deliveryDate) return 'high';
  if (daysToDelivery <= 5) return 'medium';
  return 'low';
}
