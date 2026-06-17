import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConfigStatus } from '../common/decorators/config-status.enum';

export enum ExceptionType {
  ACCESS_DENIED = 'access_denied',
  TAILGATING = 'tailgating',
  INVALID_CARD = 'invalid_card',
  AFTER_HOURS = 'after_hours',
  STRANGER = 'stranger',
  OTHER = 'other',
}

export enum ExceptionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ExceptionStatus {
  OPEN = 'open',
  HANDLING = 'handling',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class AccessException extends Document {
  @Prop({ required: true, unique: true })
  recordNo: string;

  @Prop({ required: true, enum: ExceptionType })
  type: ExceptionType;

  @Prop({ required: true, enum: ExceptionSeverity, default: ExceptionSeverity.MEDIUM })
  severity: ExceptionSeverity;

  @Prop({ required: true, enum: ExceptionStatus, default: ExceptionStatus.OPEN })
  status: ExceptionStatus;

  @Prop({ required: true })
  occurrenceTime: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ type: String })
  deviceId?: string;

  @Prop({ type: String })
  personName?: string;

  @Prop({ type: String })
  personCardNo?: string;

  @Prop({ required: true })
  impactScope: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  currentOwner?: Types.ObjectId;

  @Prop({ type: [{
    date: Date,
    content: String,
    handler: { type: Types.ObjectId, ref: 'User' },
    status: String,
  }] })
  processLogs: Array<{
    date: Date;
    content: string;
    handler: Types.ObjectId;
    status?: string;
  }>;

  @Prop({ type: String })
  resolution?: string;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ enum: ConfigStatus, default: ConfigStatus.ENABLED })
  configStatus: ConfigStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const AccessExceptionSchema = SchemaFactory.createForClass(AccessException);
