import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'profit_records' })
export class ProfitRecord extends Document {
  @Prop({ required: true })
  date: string;

  @Prop()
  batchId: string;

  @Prop()
  batchNo: string;

  @Prop()
  recipeId: string;

  @Prop()
  recipeName: string;

  @Prop()
  teamId: string;

  @Prop()
  teamName: string;

  @Prop({ required: true, default: 0 })
  revenue: number;

  @Prop({ required: true, default: 0 })
  cost: number;

  @Prop({ default: 0 })
  materialCost: number;

  @Prop({ default: 0 })
  supplyCost: number;

  @Prop({ default: 0 })
  reworkCost: number;

  @Prop({ required: true, default: 0 })
  margin: number;

  @Prop({ required: true, default: 0 })
  marginRate: number;

  @Prop({ default: 0 })
  quantity: number;

  @Prop({ default: 0 })
  batchCount: number;

  @Prop({ default: false })
  isSandbox: boolean;
}

export const ProfitRecordSchema = SchemaFactory.createForClass(ProfitRecord);
