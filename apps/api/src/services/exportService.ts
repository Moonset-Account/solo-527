import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import type {
  ExportTask,
  PaginationResult,
  ExportTaskStatus,
} from '@seat-platform/shared';
import { ExportTaskModel, type IExportTaskDocument } from '../models/ExportTask';
import { SeatModel } from '../models/Seat';
import { UsageRecordModel } from '../models/UsageRecord';
import { ReminderModel } from '../models/Reminder';
import { PaymentCallbackModel } from '../models/PaymentCallback';
import { AuditLogModel } from '../models/AuditLog';
import { OperationLogModel } from '../models/OperationLog';
import { createAuditLog } from '../models/AuditLog';
import { generateId, nowISO } from '../utils';
import { config } from '../config';

export interface CreateExportTaskInput {
  name: string;
  type: ExportTask['type'];
  filters: Record<string, unknown>;
}

export interface ListExportTasksQuery {
  page: number;
  pageSize: number;
  status?: ExportTaskStatus;
  type?: ExportTask['type'];
  createdBy?: string;
}

function toExportTask(doc: IExportTaskDocument): ExportTask {
  return doc.toJSON() as unknown as ExportTask;
}

function ensureExportDir(): string {
  const dir = path.resolve(config.exportDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function createExportTask(
  input: CreateExportTaskInput,
  createdBy = 'system'
): Promise<ExportTask> {
  const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const task = new ExportTaskModel({
    _id: generateId('exp_'),
    name: input.name,
    type: input.type,
    status: 'pending',
    filters: input.filters,
    totalRows: 0,
    exportedRows: 0,
    createdBy,
    createdAt: nowISO(),
    expiredAt,
  });
  await task.save();

  await createAuditLog({
    entityType: 'export',
    entityId: task._id,
    action: 'export.create',
    newValue: { type: input.type, name: input.name },
    operatorName: createdBy,
  });

  processExportTask(task._id).catch((err) => {
    console.error('[Export] Background task failed:', err);
  });

  return toExportTask(task);
}

async function processExportTask(taskId: string): Promise<void> {
  const task = await ExportTaskModel.findById(taskId);
  if (!task) return;

  try {
    task.status = 'processing';
    task.startedAt = nowISO();
    await task.save();

    const exportDir = ensureExportDir();
    const fileName = `${task._id}_${task.type}_${Date.now()}.csv`;
    const filePath = path.join(exportDir, fileName);

    let totalRows = 0;
    let exportedRows = 0;

    switch (task.type) {
      case 'seats':
        ({ totalRows, exportedRows } = await exportSeats(filePath, task.filters));
        break;
      case 'usage':
        ({ totalRows, exportedRows } = await exportUsage(filePath, task.filters));
        break;
      case 'reminders':
        ({ totalRows, exportedRows } = await exportReminders(filePath, task.filters));
        break;
      case 'payments':
        ({ totalRows, exportedRows } = await exportPayments(filePath, task.filters));
        break;
      case 'audit_logs':
        ({ totalRows, exportedRows } = await exportAuditLogs(filePath, task.filters));
        break;
      case 'operations':
        ({ totalRows, exportedRows } = await exportOperations(filePath, task.filters));
        break;
    }

    const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;

    task.status = 'completed';
    task.totalRows = totalRows;
    task.exportedRows = exportedRows;
    task.filePath = fileName;
    task.fileSize = stat?.size || 0;
    task.completedAt = nowISO();
    await task.save();
  } catch (err) {
    console.error('[Export] Task error:', taskId, err);
    task.status = 'failed';
    task.errorMessage = err instanceof Error ? err.message : '未知错误';
    await task.save();
  }
}

async function exportSeats(filePath: string, filters: Record<string, unknown>): Promise<{ totalRows: number; exportedRows: number }> {
  const filter: Record<string, unknown> = {};
  if (filters.status) filter.status = filters.status;
  if (filters.trialStatus) filter.trialStatus = filters.trialStatus;

  const seats = await SeatModel.find(filter).sort({ createdAt: -1 }).lean().exec();

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'seatCode', title: '席位编码' },
      { id: 'customerName', title: '客户名称' },
      { id: 'customerEmail', title: '客户邮箱' },
      { id: 'status', title: '状态' },
      { id: 'trialStatus', title: '试用状态' },
      { id: 'quota', title: '配额' },
      { id: 'usedQuota', title: '已用量' },
      { id: 'usagePercent', title: '使用率(%)' },
      { id: 'expireDate', title: '到期日期' },
      { id: 'ownerName', title: '负责人' },
      { id: 'createdAt', title: '创建时间' },
    ],
  });

  const records = seats.map((s) => ({
    seatCode: s.seatCode,
    customerName: s.customerName,
    customerEmail: s.customerEmail,
    status: s.status,
    trialStatus: s.trialStatus,
    quota: s.quota,
    usedQuota: s.usedQuota,
    usagePercent: s.quota > 0 ? Math.round((s.usedQuota / s.quota) * 100) : 0,
    expireDate: s.expireDate || '',
    ownerName: s.ownerName || '',
    createdAt: s.createdAt,
  }));

  await csvWriter.writeRecords(records);
  return { totalRows: seats.length, exportedRows: records.length };
}

async function exportUsage(filePath: string, filters: Record<string, unknown>): Promise<{ totalRows: number; exportedRows: number }> {
  const filter: Record<string, unknown> = {};
  if (filters.seatId) filter.seatId = filters.seatId;
  if (filters.startDate || filters.endDate) {
    filter.timestamp = {};
    if (filters.startDate) (filter.timestamp as Record<string, unknown>).$gte = filters.startDate;
    if (filters.endDate) (filter.timestamp as Record<string, unknown>).$lte = filters.endDate;
  }

  const records = await UsageRecordModel.find(filter).sort({ timestamp: -1 }).limit(50000).lean().exec();

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'seatCode', title: '席位编码' },
      { id: 'timestamp', title: '时间' },
      { id: 'apiCalls', title: 'API调用量' },
      { id: 'errorCount', title: '错误数' },
      { id: 'avgLatency', title: '平均延迟(ms)' },
      { id: 'endpoint', title: '接口' },
      { id: 'statusCode', title: '状态码' },
    ],
  });

  const data = records.map((r) => ({
    seatCode: r.seatCode,
    timestamp: r.timestamp,
    apiCalls: r.apiCalls,
    errorCount: r.errorCount,
    avgLatency: r.avgLatency,
    endpoint: r.endpoint || '',
    statusCode: r.statusCode || '',
  }));

  await csvWriter.writeRecords(data);
  return { totalRows: records.length, exportedRows: data.length };
}

async function exportReminders(filePath: string, filters: Record<string, unknown>): Promise<{ totalRows: number; exportedRows: number }> {
  const filter: Record<string, unknown> = {};
  if (filters.status) filter.status = filters.status;
  if (filters.level) filter.level = filters.level;
  if (filters.type) filter.type = filters.type;

  const records = await ReminderModel.find(filter).sort({ createdAt: -1 }).limit(50000).lean().exec();

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'seatCode', title: '席位编码' },
      { id: 'customerName', title: '客户名称' },
      { id: 'level', title: '级别' },
      { id: 'type', title: '类型' },
      { id: 'status', title: '状态' },
      { id: 'title', title: '标题' },
      { id: 'content', title: '内容' },
      { id: 'sentAt', title: '发送时间' },
      { id: 'createdAt', title: '创建时间' },
    ],
  });

  const data = records.map((r) => ({
    seatCode: r.seatCode,
    customerName: r.customerName,
    level: r.level,
    type: r.type,
    status: r.status,
    title: r.title,
    content: r.content,
    sentAt: r.sentAt || '',
    createdAt: r.createdAt,
  }));

  await csvWriter.writeRecords(data);
  return { totalRows: records.length, exportedRows: data.length };
}

async function exportPayments(filePath: string, filters: Record<string, unknown>): Promise<{ totalRows: number; exportedRows: number }> {
  const filter: Record<string, unknown> = {};
  if (filters.callbackStatus) filter.callbackStatus = filters.callbackStatus;
  if (filters.riskLevel) filter.riskLevel = filters.riskLevel;

  const records = await PaymentCallbackModel.find(filter).sort({ createdAt: -1 }).limit(50000).lean().exec();

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'seatCode', title: '席位编码' },
      { id: 'customerName', title: '客户名称' },
      { id: 'transactionId', title: '交易号' },
      { id: 'amount', title: '金额' },
      { id: 'currency', title: '币种' },
      { id: 'callbackStatus', title: '回调状态' },
      { id: 'riskLevel', title: '风险等级' },
      { id: 'retryCount', title: '重试次数' },
      { id: 'errorMessage', title: '错误信息' },
      { id: 'remark', title: '备注' },
      { id: 'resolution', title: '处理结果' },
      { id: 'createdAt', title: '创建时间' },
    ],
  });

  const data = records.map((r) => ({
    seatCode: r.seatCode,
    customerName: r.customerName,
    transactionId: r.transactionId,
    amount: r.amount,
    currency: r.currency,
    callbackStatus: r.callbackStatus,
    riskLevel: r.riskLevel,
    retryCount: r.retryCount,
    errorMessage: r.errorMessage || '',
    remark: r.remark || '',
    resolution: r.resolution || '',
    createdAt: r.createdAt,
  }));

  await csvWriter.writeRecords(data);
  return { totalRows: records.length, exportedRows: data.length };
}

async function exportAuditLogs(filePath: string, filters: Record<string, unknown>): Promise<{ totalRows: number; exportedRows: number }> {
  const filter: Record<string, unknown> = {};
  if (filters.entityType) filter.entityType = filters.entityType;
  if (filters.entityId) filter.entityId = filters.entityId;

  const records = await AuditLogModel.find(filter).sort({ createdAt: -1 }).limit(50000).lean().exec();

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'entityType', title: '实体类型' },
      { id: 'entityId', title: '实体ID' },
      { id: 'action', title: '操作' },
      { id: 'fieldName', title: '字段' },
      { id: 'oldValue', title: '旧值' },
      { id: 'newValue', title: '新值' },
      { id: 'operatorName', title: '操作人' },
      { id: 'remark', title: '备注' },
      { id: 'createdAt', title: '时间' },
    ],
  });

  const data = records.map((r) => ({
    entityType: r.entityType,
    entityId: r.entityId,
    action: r.action,
    fieldName: r.fieldName || '',
    oldValue: r.oldValue !== undefined ? JSON.stringify(r.oldValue) : '',
    newValue: r.newValue !== undefined ? JSON.stringify(r.newValue) : '',
    operatorName: r.operatorName,
    remark: r.remark || '',
    createdAt: r.createdAt,
  }));

  await csvWriter.writeRecords(data);
  return { totalRows: records.length, exportedRows: data.length };
}

async function exportOperations(filePath: string, filters: Record<string, unknown>): Promise<{ totalRows: number; exportedRows: number }> {
  const filter: Record<string, unknown> = {};
  if (filters.userId) filter.userId = filters.userId;
  if (filters.action) filter.action = filters.action;

  const records = await OperationLogModel.find(filter).sort({ createdAt: -1 }).limit(50000).lean().exec();

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'userName', title: '用户名' },
      { id: 'action', title: '操作类型' },
      { id: 'targetType', title: '目标类型' },
      { id: 'targetId', title: '目标ID' },
      { id: 'detail', title: '详情' },
      { id: 'ip', title: 'IP地址' },
      { id: 'createdAt', title: '时间' },
    ],
  });

  const data = records.map((r) => ({
    userName: r.userName,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId || '',
    detail: r.detail,
    ip: r.ip || '',
    createdAt: r.createdAt,
  }));

  await csvWriter.writeRecords(data);
  return { totalRows: records.length, exportedRows: data.length };
}

export async function listExportTasks(
  query: ListExportTasksQuery
): Promise<PaginationResult<ExportTask>> {
  const { page, pageSize, status, type, createdBy } = query;
  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (createdBy) filter.createdBy = createdBy;

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    ExportTaskModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
    ExportTaskModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(toExportTask),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getExportTaskById(id: string): Promise<ExportTask | null> {
  const doc = await ExportTaskModel.findById(id);
  return doc ? toExportTask(doc) : null;
}

export function getExportFilePath(fileName: string): string {
  return path.join(ensureExportDir(), fileName);
}
