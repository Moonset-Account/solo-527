import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface ReviewItem {
  anomalyId: Types.ObjectId;
  anomalyTitle: string;
  severity: string;
  category: string;
  status: string;
  rootCause: string;
  solution: string;
  preventive: string;
}

export interface ReviewSchedule {
  weeklyOwner: string;
  weeklyTime: string;
  monthlyOwner: string;
  monthlyTime: string;
  participants: string[];
}

export type ReportStatus = 'draft' | 'published' | 'archived';

@Schema({ timestamps: true, collection: 'reports' })
export class Report extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, index: true })
  reportType: 'weekly' | 'monthly' | 'custom';

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop()
  summary: string;

  @Prop()
  highlights: string;

  @Prop()
  problems: string;

  @Prop()
  improvements: string;

  @Prop({ type: [Object], default: [] })
  reviewItems: ReviewItem[];

  @Prop({ type: Object })
  schedule: ReviewSchedule;

  @Prop({ type: Object })
  statistics: Record<string, any>;

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  })
  status: ReportStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdById: Types.ObjectId;

  @Prop()
  createdByName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  publishedById: Types.ObjectId;

  @Prop()
  publishedByName: string;

  @Prop({ type: Date })
  publishedAt: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ reportType: 1, startDate: -1, status: 1 });
