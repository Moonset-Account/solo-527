import mongoose, { Schema, Document } from 'mongoose';
import type {
  Reminder,
  ReminderLevel,
  ReminderStatus,
} from '@seat-platform/shared';

export type IReminderDocument = Document<unknown, unknown, Omit<Reminder, 'id'>> &
  Omit<Reminder, 'id'> & { _id: string };

const ReminderSchema = new Schema<IReminderDocument>(
  {
    _id: { type: String, required: true },
    seatId: { type: String, required: true, index: true },
    seatCode: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    level: {
      type: String,
      enum: ['info', 'warning', 'critical', 'urgent'] as const satisfies readonly ReminderLevel[],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'read', 'dismissed', 'expired'] as const satisfies readonly ReminderStatus[],
      required: true,
      default: 'pending',
      index: true,
    },
    type: {
      type: String,
      enum: ['quota', 'trial_expire', 'payment_failed', 'abnormal_usage'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    threshold: { type: Number },
    currentUsage: { type: Number },
    recipientEmails: [{ type: String, required: true }],
    sentAt: { type: String },
    readAt: { type: String },
    dismissedAt: { type: String },
    createdAt: { type: String, required: true },
  },
  {
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

ReminderSchema.index({ createdAt: -1 });
ReminderSchema.index({ level: 1, status: 1 });

export const ReminderModel = mongoose.model<IReminderDocument>('Reminder', ReminderSchema);
