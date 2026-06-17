import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConfigStatus } from '../common/decorators/config-status.enum';

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum MaintenanceStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Maintenance extends Document {
  @Prop({ required: true, unique: true })
  orderNo: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, enum: MaintenancePriority, default: MaintenancePriority.MEDIUM })
  priority: MaintenancePriority;

  @Prop({ required: true, enum: MaintenanceStatus, default: MaintenanceStatus.PENDING })
  status: MaintenanceStatus;

  @Prop({ type: String })
  reporterName?: string;

  @Prop({ type: String })
  reporterPhone?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignee?: Types.ObjectId;

  @Prop({ type: [{ date: Date, content: String, operator: { type: Types.ObjectId, ref: 'User' } }] })
  handleLogs: Array<{ date: Date; content: string; operator: Types.ObjectId }>;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ enum: ConfigStatus, default: ConfigStatus.ENABLED })
  configStatus: ConfigStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);
