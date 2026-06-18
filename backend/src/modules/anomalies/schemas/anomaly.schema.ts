import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnomalySeverity = 'critical' | 'warning' | 'info';
export type AnomalyStatus = 'pending' | 'processing' | 'resolved' | 'ignored';
export type AnomalyCategory =
  | 'user_growth'
  | 'retention'
  | 'conversion'
  | 'activation'
  | 'revenue'
  | 'other';

export interface TrendPoint {
  timestamp: Date;
  value: number;
  expected: number;
  deviation: number;
}

export interface AnomalyCause {
  type: string;
  description: string;
  confidence: number;
  evidence: string;
}

@Schema({ timestamps: true, collection: 'anomalies' })
export class Anomaly extends Document {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({
    type: String,
    enum: ['user_growth', 'retention', 'conversion', 'activation', 'revenue', 'other'],
    required: true,
    index: true,
  })
  category: AnomalyCategory;

  @Prop({ required: true })
  metricName: string;

  @Prop({
    type: String,
    enum: ['critical', 'warning', 'info'],
    default: 'warning',
    index: true,
  })
  severity: AnomalySeverity;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'resolved', 'ignored'],
    default: 'pending',
    index: true,
  })
  status: AnomalyStatus;

  @Prop({ required: true, type: Number })
  currentValue: number;

  @Prop({ type: Number })
  expectedValue: number;

  @Prop({ type: Number })
  deviationPercent: number;

  @Prop({ type: Date, required: true })
  detectedAt: Date;

  @Prop({ type: [Object], default: [] })
  trendData: TrendPoint[];

  @Prop({ type: [Object], default: [] })
  possibleCauses: AnomalyCause[];

  @Prop()
  datasetId: Types.ObjectId;

  @Prop()
  datasetName: string;

  @Prop()
  summary: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigneeId: Types.ObjectId;

  @Prop()
  assigneeName: string;

  @Prop()
  resolvedCause: string;

  @Prop({ type: Date })
  resolvedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedById: Types.ObjectId;

  @Prop()
  resolvedByName: string;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const AnomalySchema = SchemaFactory.createForClass(Anomaly);

AnomalySchema.index({ status: 1, severity: 1, createdAt: -1 });
AnomalySchema.index({ category: 1, detectedAt: -1 });
AnomalySchema.index({ assigneeId: 1, status: 1 });
