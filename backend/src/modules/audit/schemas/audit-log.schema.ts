import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuditAction } from '@/common/enums/index.enum';

export type AuditLogDocument = AuditLog & Document;

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLog {
  _id: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(AuditAction), required: true, index: true })
  action: AuditAction;

  @Prop({ type: String, required: true, index: true })
  module: string;

  @Prop({ type: String, required: true, index: true })
  targetId: string;

  @Prop({ type: String })
  targetName: string;

  @Prop({ type: String, index: true })
  operatorId: string;

  @Prop({ type: String })
  operatorName: string;

  @Prop({ type: Object })
  details: Record<string, any>;

  @Prop({ type: String })
  remark: string;

  @Prop({ type: Date, default: Date.now, index: true })
  actionTime: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ module: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ operatorId: 1, createdAt: -1 });
AuditLogSchema.index({ targetId: 1, createdAt: -1 });
