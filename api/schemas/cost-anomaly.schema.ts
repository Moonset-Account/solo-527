import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'cost_anomalies' })
export class CostAnomaly extends Document {
  @Prop({ required: true, enum: ['over_cost', 'frequent_rework', 'high_scrap', 'budget_exceeded', 'low_stock', 'cost_spike'] })
  type: string;

  @Prop({ required: true, enum: ['low', 'medium', 'high'] })
  severity: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  ingredientId: string;

  @Prop()
  ingredientName: string;

  @Prop()
  batchId: string;

  @Prop({ type: [String], default: [] })
  relatedRecords: string[];

  @Prop()
  expectedCost: number;

  @Prop()
  actualCost: number;

  @Prop()
  impactScope: string;

  @Prop()
  responsiblePerson: string;

  @Prop()
  handlingPlan: string;

  @Prop({ required: true, enum: ['open', 'handling', 'resolved'], default: 'open' })
  status: string;

  @Prop()
  resolvedAt: Date;

  @Prop({ default: false })
  isSandbox: boolean;
}

export const CostAnomalySchema = SchemaFactory.createForClass(CostAnomaly);
