import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Followup {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Lead' })
  leadId: Types.ObjectId;

  @Prop({ required: true, enum: ['phone', 'wechat', 'visit'] })
  type: string;

  @Prop({ required: true, type: Date })
  scheduledAt: Date;

  @Prop({ type: Date })
  completedAt: Date;

  @Prop()
  result: string;

  @Prop({ type: Date })
  nextFollowupAt: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type FollowupDocument = Followup & Document;
export const FollowupSchema = SchemaFactory.createForClass(Followup);

FollowupSchema.index({ leadId: 1 });
FollowupSchema.index({ scheduledAt: 1 });
FollowupSchema.index({ createdBy: 1 });
FollowupSchema.index({ completedAt: 1 });
