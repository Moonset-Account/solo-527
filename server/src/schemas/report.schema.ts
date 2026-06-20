import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ required: true })
  activityId: string;

  @Prop({ required: true })
  reporterId: string;

  @Prop({ required: true })
  reporterName: string;

  @Prop({ required: true })
  targetId: string;

  @Prop({ required: true })
  targetName: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true, enum: ['pending', 'reviewing', 'resolved', 'rejected'], default: 'pending' })
  status: string;

  @Prop()
  resolvedBy: string;

  @Prop()
  resolvedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
