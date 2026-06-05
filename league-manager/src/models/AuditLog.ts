import mongoose, { Schema, Document } from 'mongoose';
import dbConnect from '@/lib/db';

export interface AuditLogDocument extends Document {
  operatorId: mongoose.Types.ObjectId;
  module: 'team' | 'schedule' | 'referee' | 'score' | 'appeal' | 'venue' | 'user';
  action: string;
  targetId?: mongoose.Types.ObjectId;
  detail?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    operatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    module: {
      type: String,
      enum: ['team', 'schedule', 'referee', 'score', 'appeal', 'venue', 'user'],
      required: true,
    },
    action: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId },
    detail: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ operatorId: 1 });
AuditLogSchema.index({ module: 1, action: 1 });
AuditLogSchema.index({ targetId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema);
