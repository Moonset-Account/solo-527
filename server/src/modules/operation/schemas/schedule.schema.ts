import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type ScheduleDocument = Schedule & Document;

export enum ScheduleStatus {
  PENDING = 'pending',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
}

@Schema({ collection: 'schedules', timestamps: true })
export class Schedule {
  _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Content' })
  contentId: string;

  @Prop()
  contentTitle: string;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'PlatformAccount' }] })
  platformIds: string[];

  @Prop({ required: true })
  scheduledTime: Date;

  @Prop({ type: String, enum: ScheduleStatus, default: ScheduleStatus.PENDING })
  status: ScheduleStatus;

  @Prop()
  publisher: string;

  @Prop()
  remark: string;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
