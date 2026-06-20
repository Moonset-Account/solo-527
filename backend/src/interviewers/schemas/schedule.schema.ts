import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScheduleDocument = Schedule & Document;

export enum ScheduleStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  UNAVAILABLE = 'unavailable',
}

@Schema({ timestamps: true })
export class Schedule {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  interviewerId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({
    type: String,
    enum: ScheduleStatus,
    default: ScheduleStatus.AVAILABLE,
  })
  status: ScheduleStatus;

  @Prop({ type: Types.ObjectId, ref: 'Interview' })
  interviewId?: Types.ObjectId;

  @Prop()
  location?: string;

  @Prop()
  notes?: string;

  @Prop()
  repeatRule?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

ScheduleSchema.index({ interviewerId: 1, date: 1, startTime: 1 }, { unique: true });
ScheduleSchema.index({ date: 1, status: 1 });
