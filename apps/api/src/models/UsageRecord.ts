import mongoose, { Schema, Document } from 'mongoose';
import type { UsageRecord } from '@seat-platform/shared';

export type IUsageRecordDocument = Document<unknown, unknown, Omit<UsageRecord, 'id'>> &
  Omit<UsageRecord, 'id'> & { _id: string };

const UsageRecordSchema = new Schema<IUsageRecordDocument>(
  {
    _id: { type: String, required: true },
    seatId: { type: String, required: true, index: true },
    seatCode: { type: String, required: true, index: true },
    timestamp: { type: String, required: true, index: true },
    apiCalls: { type: Number, required: true, default: 0 },
    errorCount: { type: Number, required: true, default: 0 },
    avgLatency: { type: Number, required: true, default: 0 },
    endpoint: { type: String, index: true },
    statusCode: { type: Number, index: true },
    rawData: { type: Schema.Types.Mixed },
  },
  {
    collection: 'usage_records',
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

UsageRecordSchema.index({ seatId: 1, timestamp: -1 });
UsageRecordSchema.index({ timestamp: -1 });
UsageRecordSchema.index({ seatCode: 1, timestamp: -1 });

export const UsageRecordModel = mongoose.model<IUsageRecordDocument>('UsageRecord', UsageRecordSchema);
