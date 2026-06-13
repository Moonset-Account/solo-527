import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type ScheduleDocument = Schedule & Document;

export enum ScheduleStatus {
  PENDING = 'pending',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
}

@Schema({ collection: 'schedules', timestamps: true })
export class Schedule extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Content' })
  contentId?: string;

  @Prop()
  contentTitle?: string;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'PlatformAccount' }] })
  platformIds: string[];

  @Prop({ required: true })
  scheduledTime: Date;

  @Prop({ type: String, enum: ScheduleStatus, default: ScheduleStatus.PENDING })
  status: ScheduleStatus;

  @Prop()
  publisher?: string;

  @Prop()
  remark?: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
