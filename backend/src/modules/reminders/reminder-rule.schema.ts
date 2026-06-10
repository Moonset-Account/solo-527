import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReminderRuleDocument = ReminderRule & Document;

export enum ReminderLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  BLOCKING = 'blocking',
}

export enum ReminderType {
  APPOINTMENT_CONFLICT = 'appointment_conflict',
  APPOINTMENT_REMIND = 'appointment_remind',
  MEMBERSHIP_EXPIRE = 'membership_expire',
  LOW_STOCK = 'low_stock',
  DAILY_REPORT = 'daily_report',
  CUSTOM = 'custom',
}

export enum ReminderCategory {
  DAILY = 'daily',
  ALERT = 'alert',
}

@Schema({ timestamps: true })
export class ReminderRule {
  @Prop({ required: true })
  name: string;

  @Prop({ enum: ReminderType, required: true })
  type: ReminderType;

  @Prop({ enum: ReminderLevel, default: ReminderLevel.INFO })
  level: ReminderLevel;

  @Prop({ enum: ReminderCategory, default: ReminderCategory.DAILY })
  category: ReminderCategory;

  @Prop()
  description: string;

  @Prop()
  threshold: number;

  @Prop()
  thresholdUnit: string;

  @Prop({ type: Object })
  config: Record<string, any>;

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  sort: number;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const ReminderRuleSchema = SchemaFactory.createForClass(ReminderRule);
