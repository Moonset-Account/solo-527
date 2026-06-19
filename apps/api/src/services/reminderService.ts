import type {
  Reminder,
  ReminderBatch,
  PaginationResult,
  ReminderLevel,
} from '@seat-platform/shared';
import { ReminderModel, type IReminderDocument } from '../models/Reminder';
import { ReminderBatchModel, type IReminderBatchDocument } from '../models/ReminderBatch';
import { SeatModel } from '../models/Seat';
import { createAuditLog } from '../models/AuditLog';
import { generateId, nowISO } from '../utils';

export interface CreateReminderInput {
  seatId: string;
  level: ReminderLevel;
  type: Reminder['type'];
  title: string;
  content: string;
  threshold?: number;
  currentUsage?: number;
  recipientEmails: string[];
}

export interface BatchSendReminderInput {
  seatIds: string[];
  level: ReminderLevel;
  type: Reminder['type'];
  name: string;
  titleTemplate: string;
  contentTemplate: string;
}

export interface ListRemindersQuery {
  page: number;
  pageSize: number;
  status?: Reminder['status'];
  level?: ReminderLevel;
  type?: Reminder['type'];
  seatId?: string;
  startDate?: string;
  endDate?: string;
}

function toReminder(doc: IReminderDocument): Reminder {
  return doc.toJSON() as unknown as Reminder;
}

function toReminderBatch(doc: IReminderBatchDocument): ReminderBatch {
  return doc.toJSON() as unknown as ReminderBatch;
}

export async function createReminder(
  input: CreateReminderInput,
  operatorName = 'system'
): Promise<Reminder> {
  const seat = await SeatModel.findById(input.seatId);
  if (!seat) {
    throw new Error(`席不存在: ${input.seatId}`);
  }

  const reminder = new ReminderModel({
    _id: generateId('rem_'),
    seatId: input.seatId,
    seatCode: seat.seatCode,
    customerName: seat.customerName,
    level: input.level,
    status: 'pending',
    type: input.type,
    title: input.title,
    content: input.content,
    threshold: input.threshold,
    currentUsage: input.currentUsage,
    recipientEmails: input.recipientEmails,
    sentAt: nowISO(),
    createdAt: nowISO(),
  });
  reminder.status = 'sent';
  await reminder.save();

  await createAuditLog({
    entityType: 'reminder',
    entityId: reminder._id,
    action: 'reminder.send',
    newValue: { seatId: input.seatId, type: input.type, level: input.level },
    operatorName,
  });

  return toReminder(reminder);
}

export async function batchSendReminders(
  input: BatchSendReminderInput,
  operatorName = 'system',
  operatorId = 'system'
): Promise<ReminderBatch> {
  const seats = await SeatModel.find({ _id: { $in: input.seatIds } }).exec();
  if (seats.length === 0) {
    throw new Error('未找到匹配的席位');
  }

  const batchId = generateId('batch_');
  const batch = new ReminderBatchModel({
    _id: batchId,
    name: input.name,
    level: input.level,
    type: input.type,
    seatIds: input.seatIds,
    totalCount: seats.length,
    successCount: 0,
    failedCount: 0,
    status: 'processing',
    createdAt: nowISO(),
    createdBy: operatorId,
  });
  await batch.save();

  const createdBy = operatorName;
  const reminderPromises = seats.map(async (seat) => {
    try {
      const title = input.titleTemplate
        .replace(/\{customerName\}/g, seat.customerName)
        .replace(/\{seatCode\}/g, seat.seatCode);
      const content = input.contentTemplate
        .replace(/\{customerName\}/g, seat.customerName)
        .replace(/\{seatCode\}/g, seat.seatCode)
        .replace(/\{usedQuota\}/g, String(seat.usedQuota))
        .replace(/\{quota\}/g, String(seat.quota));

      const reminder = new ReminderModel({
        _id: generateId('rem_'),
        seatId: seat._id,
        seatCode: seat.seatCode,
        customerName: seat.customerName,
        level: input.level,
        status: 'sent',
        type: input.type,
        title,
        content,
        currentUsage: seat.usedQuota,
        threshold: seat.usageThreshold,
        recipientEmails: seat.ownerEmail ? [seat.ownerEmail, seat.customerEmail] : [seat.customerEmail],
        sentAt: nowISO(),
        createdAt: nowISO(),
      });
      await reminder.save();
      return true;
    } catch {
      return false;
    }
  });

  const results = await Promise.all(reminderPromises);
  const successCount = results.filter(Boolean).length;

  batch.successCount = successCount;
  batch.failedCount = seats.length - successCount;
  batch.status = successCount > 0 ? 'completed' : 'failed';
  await batch.save();

  await createAuditLog({
    entityType: 'reminder',
    entityId: batchId,
    action: 'reminder.batch_send',
    newValue: { count: seats.length, type: input.type, level: input.level },
    operatorId,
    operatorName: createdBy,
  });

  return toReminderBatch(batch);
}

export async function listReminders(
  query: ListRemindersQuery
): Promise<PaginationResult<Reminder>> {
  const { page, pageSize, status, level, type, seatId, startDate, endDate } = query;
  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (level) filter.level = level;
  if (type) filter.type = type;
  if (seatId) filter.seatId = seatId;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as Record<string, unknown>).$gte = startDate;
    if (endDate) (filter.createdAt as Record<string, unknown>).$lte = endDate;
  }

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    ReminderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
    ReminderModel.countDocuments(filter),
  ]);

  return {
    items: docs.map(toReminder),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getReminderById(id: string): Promise<Reminder | null> {
  const doc = await ReminderModel.findById(id);
  return doc ? toReminder(doc) : null;
}

export async function dismissReminder(id: string, operatorName = 'system'): Promise<Reminder | null> {
  const doc = await ReminderModel.findByIdAndUpdate(
    id,
    { status: 'dismissed', dismissedAt: nowISO() },
    { new: true }
  );
  if (doc) {
    await createAuditLog({
      entityType: 'reminder',
      entityId: id,
      action: 'reminder.send',
      remark: '已忽略提醒',
      operatorName,
    });
    return toReminder(doc);
  }
  return null;
}

export async function getReminderBatches(
  page: number,
  pageSize: number
): Promise<PaginationResult<ReminderBatch>> {
  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    ReminderBatchModel.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
    ReminderBatchModel.countDocuments(),
  ]);

  return {
    items: docs.map(toReminderBatch),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
