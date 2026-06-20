import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InterviewerDocument = Interviewer & Document;

@Schema({ timestamps: true })
export class Interviewer {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: [String] })
  specialties: string[];

  @Prop({ type: [String] })
  levels: string[];

  @Prop({ default: 0 })
  totalInterviews: number;

  @Prop({ default: 0 })
  monthlyQuota: number;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop()
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const InterviewerSchema = SchemaFactory.createForClass(Interviewer);
