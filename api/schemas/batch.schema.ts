import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'batches' })
export class Batch extends Document {
  @Prop({ required: true })
  batchNo: string;

  @Prop({ required: true })
  recipeId: string;

  @Prop({ required: true })
  recipeName: string;

  @Prop()
  teamId: string;

  @Prop()
  teamName: string;

  @Prop({ required: true })
  plannedQty: number;

  @Prop()
  actualQty: number;

  @Prop({ required: true, enum: ['pending', 'in_progress', 'completed', 'picked_up', 'scrapped'] })
  status: string;

  @Prop({ required: true })
  unit: string;

  @Prop()
  startTime: Date;

  @Prop()
  endTime: Date;

  @Prop({ type: [{ url: String, name: String, uploadedAt: Date }] })
  attachments: { url: string; name: string; uploadedAt: Date }[];

  @Prop({ type: [{ content: String, author: String, createdAt: Date }] })
  notes: { content: string; author: string; createdAt: Date }[];

  @Prop({ type: [{ field: String, oldValue: MongooseSchema.Types.Mixed, newValue: MongooseSchema.Types.Mixed, changedBy: String, changedAt: Date }] })
  history: { field: string; oldValue: any; newValue: any; changedBy: string; changedAt: Date }[];

  @Prop({ type: Number, default: 0 })
  standardCost: number;

  @Prop({ type: Number, default: 0 })
  actualCost: number;

  @Prop({ type: Number, default: 0 })
  costVariance: number;

  @Prop({ type: Number, default: 0 })
  reworkCost: number;

  @Prop({ type: Number, default: 0 })
  consumableCost: number;

  @Prop({ type: Number, default: 0 })
  scrapQty: number;

  @Prop({ type: Number, default: 0 })
  reworkQty: number;

  @Prop()
  parentBatchId: string;

  @Prop({ type: Boolean, default: false })
  isRework: boolean;

  @Prop()
  deletedAt: Date;

  @Prop({ default: false })
  isSandbox: boolean;
}

export const BatchSchema = SchemaFactory.createForClass(Batch);
