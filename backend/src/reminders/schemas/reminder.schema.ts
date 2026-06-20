import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReminderType } from '../../common/enums/reminder-type.enum';

export type ReminderDocument = Reminder & Document;

@Schema({ timestamps: true })
export class Reminder {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ReminderType,
    required: true,
  })
  type: ReminderType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Object })
  metadata?: {
    module?: string;
    recordId?: string;
    actionUrl?: string;
    relatedData?: any;
  };

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'ReminderConfig' })
  configId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);

ReminderSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
