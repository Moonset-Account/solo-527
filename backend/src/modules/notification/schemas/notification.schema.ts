import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType, NotificationPriority } from '@/common/enums/index.enum';

export type NotificationDocument = Notification & Document;

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  _id: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(NotificationType), required: true, index: true })
  type: NotificationType;

  @Prop({ type: String, enum: Object.values(NotificationPriority), default: NotificationPriority.MEDIUM })
  priority: NotificationPriority;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: [String], required: true, index: true })
  recipientIds: string[];

  @Prop({ type: [String], default: [] })
  readBy: string[];

  @Prop({ type: [String], default: [] })
  confirmedBy: string[];

  @Prop({ type: Object })
  payload: Record<string, any>;

  @Prop({ type: String })
  relatedModule: string;

  @Prop({ type: String })
  relatedId: string;

  @Prop({ type: [String], default: [] })
  channels: string[];

  @Prop({ type: Boolean, default: false })
  needConfirmation: boolean;

  @Prop({ type: Date })
  syncedToDashboardAt: Date;

  @Prop({ type: Date })
  expireAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipientIds: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ needConfirmation: 1, confirmedBy: 1 });
