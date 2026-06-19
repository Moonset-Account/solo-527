import mongoose, { Schema, Document } from 'mongoose';
import type { AuditLog, OperationAction } from '@seat-platform/shared';

export type IAuditLogDocument = Document<unknown, unknown, Omit<AuditLog, 'id'>> &
  Omit<AuditLog, 'id'> & { _id: string };

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    _id: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['seat', 'reminder', 'payment', 'export'],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    fieldName: { type: String },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    operatorId: { type: String },
    operatorName: { type: String, required: true },
    remark: { type: String },
    createdAt: { type: String, required: true },
  },
  {
    collection: 'audit_logs',
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

AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

export function createAuditLog(params: {
  entityType: AuditLog['entityType'];
  entityId: string;
  action: OperationAction;
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  operatorId?: string;
  operatorName: string;
  remark?: string;
}): Promise<IAuditLogDocument> {
  const log = new AuditLogModel({
    _id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    ...params,
    createdAt: new Date().toISOString(),
  });
  return log.save();
}
