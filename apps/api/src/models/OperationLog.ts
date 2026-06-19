import mongoose, { Schema, Document } from 'mongoose';
import type { OperationLog, OperationAction } from '@seat-platform/shared';

export type IOperationLogDocument = Document<unknown, unknown, Omit<OperationLog, 'id'>> &
  Omit<OperationLog, 'id'> & { _id: string };

const OperationLogSchema = new Schema<IOperationLogDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String, index: true },
    detail: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    createdAt: { type: String, required: true },
  },
  {
    collection: 'operation_logs',
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

OperationLogSchema.index({ userId: 1, createdAt: -1 });
OperationLogSchema.index({ createdAt: -1 });
OperationLogSchema.index({ action: 1, createdAt: -1 });

export const OperationLogModel = mongoose.model<IOperationLogDocument>('OperationLog', OperationLogSchema);

export function createOperationLog(params: {
  userId: string;
  userName: string;
  action: OperationAction;
  targetType: string;
  targetId?: string;
  detail: string;
  ip?: string;
  userAgent?: string;
}): Promise<IOperationLogDocument> {
  const log = new OperationLogModel({
    _id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    ...params,
    createdAt: new Date().toISOString(),
  });
  return log.save();
}
