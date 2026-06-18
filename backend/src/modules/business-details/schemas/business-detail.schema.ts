import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface Attachment {
  _id: Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: Types.ObjectId;
  uploadedByName: string;
  uploadedAt: Date;
}

export interface Comment {
  _id: Types.ObjectId;
  content: string;
  userId: Types.ObjectId;
  userName: string;
  createdAt: Date;
  mentions: Types.ObjectId[];
}

export interface HistoryRecord {
  _id: Types.ObjectId;
  field: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
  userId: Types.ObjectId;
  userName: string;
  changedAt: Date;
}

@Schema({ timestamps: true, collection: 'business_details' })
export class BusinessDetail extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Anomaly', required: true, index: true, unique: true })
  anomalyId: Types.ObjectId;

  @Prop({ default: [] })
  attachments: Attachment[];

  @Prop({ default: [] })
  comments: Comment[];

  @Prop({ default: [] })
  history: HistoryRecord[];

  @Prop()
  businessContext: string;

  @Prop()
  impactScope: string;

  @Prop()
  relatedBusiness: string;

  @Prop()
  rootCauseAnalysis: string;

  @Prop()
  solution: string;

  @Prop()
  preventionMeasure: string;

  @Prop({ type: [String], default: [] })
  relatedAnomalyIds: string[];

  @Prop()
  reviewStatus: 'not_started' | 'in_progress' | 'completed';

  createdAt: Date;
  updatedAt: Date;
}

export const BusinessDetailSchema = SchemaFactory.createForClass(BusinessDetail);
BusinessDetailSchema.index({ anomalyId: 1 }, { unique: true });
