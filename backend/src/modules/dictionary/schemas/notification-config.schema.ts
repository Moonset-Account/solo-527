import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType, NotificationPriority, UserRole } from '../../common/enums/index.enum';
import { AuditInfo, AuditInfoSchema } from '../../common/schemas/audit-info.schema';

export type NotificationConfigDocument = NotificationConfig & Document;

@Schema({ _id: false })
class NotifyChannel {
  @Prop({ type: Boolean, default: true })
  inApp: boolean;

  @Prop({ type: Boolean, default: false })
  email: boolean;

  @Prop({ type: Boolean, default: false })
  sms: boolean;

  @Prop({ type: Boolean, default: false })
  wechat: boolean;
}

@Schema({ collection: 'notification_configs', timestamps: true })
export class NotificationConfig {
  _id: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(NotificationType), required: true, unique: true, index: true })
  type: NotificationType;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String, enum: Object.values(NotificationPriority), default: NotificationPriority.MEDIUM })
  priority: NotificationPriority;

  @Prop({ type: [String], enum: Object.values(UserRole), default: [] })
  targetRoles: UserRole[];

  @Prop({ type: [String], default: [] })
  targetUserIds: string[];

  @Prop({ type: NotifyChannel, default: () => new NotifyChannel() })
  channels: NotifyChannel;

  @Prop({ type: String })
  template: string;

  @Prop({ type: Number, default: 0 })
  reminderIntervalMinutes: number;

  @Prop({ type: Number, default: 3 })
  maxReminders: number;

  @Prop({ type: [String], default: [] })
  scope: string[];

  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const NotificationConfigSchema = SchemaFactory.createForClass(NotificationConfig);
