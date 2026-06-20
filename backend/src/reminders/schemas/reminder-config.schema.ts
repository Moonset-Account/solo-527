import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReminderType } from '../../common/enums/reminder-type.enum';

export type ReminderConfigDocument = ReminderConfig & Document;

export enum ReminderTrigger {
  TIME_BEFORE_INTERVIEW = 'time_before_interview',
  DAILY_SCHEDULE = 'daily_schedule',
  NO_CHECKIN = 'no_checkin',
  NO_ASSESSMENT = 'no_assessment',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  INTERVIEWER_QUOTA = 'interviewer_quota',
}

@Schema({ timestamps: true })
export class ReminderConfig {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({
    type: String,
    enum: ReminderTrigger,
    required: true,
  })
  trigger: ReminderTrigger;

  @Prop({
    type: String,
    enum: ReminderType,
    required: true,
  })
  type: ReminderType;

  @Prop({ type: Object })
  config: {
    timeThresholdMinutes?: number;
    dailyTime?: string;
    checkInGraceMinutes?: number;
    assessmentDeadlineHours?: number;
    quotaWarningPercentage?: number;
    blocking?: boolean;
  };

  @Prop({ type: [String], default: ['admin', 'hr', 'interviewer'] })
  targetRoles: string[];

  @Prop({ type: [String] })
  targetUserIds?: string[];

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ReminderConfigSchema = SchemaFactory.createForClass(ReminderConfig);
