import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScheduleDocument = Schedule & Document;

export enum ScheduleType {
  WORK = 'work',
  REST = 'rest',
  LEAVE = 'leave',
  TRAINING = 'training',
}

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ required: true })
  technicianId: string;

  @Prop()
  technicianName: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ enum: ScheduleType, default: ScheduleType.WORK })
  type: ScheduleType;

  @Prop()
  startTime: string;

  @Prop()
  endTime: string;

  @Prop()
  remark: string;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

ScheduleSchema.index({ technicianId: 1, date: 1 }, { unique: true });
