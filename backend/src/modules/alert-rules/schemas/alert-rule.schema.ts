import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RuleCondition = {
  field: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne';
  value: number | string;
};

export type NotificationChannel = 'email' | 'sms' | 'webhook' | 'wechat';

export type RuleStatus = 'enabled' | 'disabled';

@Schema({ timestamps: true, collection: 'alert_rules' })
export class AlertRule extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  datasetId: Types.ObjectId;

  @Prop({ required: true })
  metricName: string;

  @Prop({ type: [Object], required: true })
  conditions: RuleCondition[];

  @Prop({
    type: String,
    enum: ['all', 'any'],
    default: 'all',
  })
  conditionLogic: 'all' | 'any';

  @Prop({
    type: [String],
    enum: ['email', 'sms', 'webhook', 'wechat'],
    default: ['email'],
  })
  notifyChannels: NotificationChannel[];

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  notifyUserIds: Types.ObjectId[];

  @Prop()
  webhookUrl: string;

  @Prop({ default: 5 })
  checkIntervalMinutes: number;

  @Prop({ default: 60 })
  suppressMinutes: number;

  @Prop({
    type: String,
    enum: ['enabled', 'disabled'],
    default: 'enabled',
    index: true,
  })
  status: RuleStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdById: Types.ObjectId;

  @Prop()
  createdByName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  lastTriggeredById: Types.ObjectId;

  @Prop({ type: Date })
  lastTriggeredAt: Date;

  @Prop({ default: 0 })
  triggerCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const AlertRuleSchema = SchemaFactory.createForClass(AlertRule);
AlertRuleSchema.index({ datasetId: 1, status: 1 });
