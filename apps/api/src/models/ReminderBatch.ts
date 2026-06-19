import mongoose, { Schema, Document } from 'mongoose';
import type { ReminderBatch, ReminderLevel } from '@seat-platform/shared';

export type IReminderBatchDocument = Document<unknown, unknown, Omit<ReminderBatch, 'id'>> &
  Omit<ReminderBatch, 'id'> & { _id: string };

const ReminderBatchSchema = new Schema<IReminderBatchDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    level: {
      type: String,
      enum: ['info', 'warning', 'critical', 'urgent'] as const satisfies readonly ReminderLevel[],
      required: true,
    },
    type: {
      type: String,
      enum: ['quota', 'trial_expire', 'payment_failed', 'abnormal_usage'],
      required: true,
    },
    seatIds: [{ type: String, required: true }],
    totalCount: { type: Number, required: true, default: 0 },
    successCount: { type: Number, required: true, default: 0 },
    failedCount: { type: Number, required: true, default: 0 },
    templateId: { type: String },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      required: true,
      default: 'processing',
      index: true,
    },
    createdAt: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  {
    collection: 'reminder_batches',
    toJSON: {
      transform: (_doc, ret) => {
        const r = ret as Record<string, unknown>;
        r.id = r._id;
        delete r._id;
        delete r.__v;
      },
    },
  }
);

ReminderBatchSchema.index({ createdAt: -1 });
ReminderBatchSchema.index({ createdBy: 1, createdAt: -1 });

export const ReminderBatchModel = mongoose.model<IReminderBatchDocument>('ReminderBatch', ReminderBatchSchema);
