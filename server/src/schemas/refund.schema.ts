import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Refund extends Document {
  @Prop({ required: true })
  registrationId: string;

  @Prop({ required: true })
  activityId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending' })
  status: string;

  @Prop()
  reviewedBy: string;

  @Prop()
  reviewedAt: Date;

  @Prop()
  processedAt: Date;
}

export const RefundSchema = SchemaFactory.createForClass(Refund);
