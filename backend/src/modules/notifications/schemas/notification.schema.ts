import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationType =
  | 'anomaly_detected'
  | 'alert_triggered'
  | 'permission_expiring'
  | 'permission_expired'
  | 'anomaly_assigned'
  | 'report_reminder'
  | 'system'
  | 'mention';

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop()
  content: string;

  @Prop({
    type: String,
    enum: ['critical', 'high', 'normal', 'low'],
    default: 'normal',
  })
  priority: NotificationPriority;

  @Prop({ type: Object })
  data: Record<string, any>;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop({ type: Date })
  readAt: Date;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  ccUserIds: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, priority: 1, createdAt: -1 });
