import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'inventory_logs' })
export class InventoryLog extends Document {
  @Prop({ required: true })
  ingredientId: string;

  @Prop({ required: true })
  ingredientName: string;

  @Prop({ required: true, enum: ['inbound', 'outbound'] })
  type: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  costPerUnit: number;

  @Prop({ required: true })
  totalCost: number;

  @Prop()
  operator: string;

  @Prop()
  note: string;

  @Prop({ default: false })
  isSandbox: boolean;
}

export const InventoryLogSchema = SchemaFactory.createForClass(InventoryLog);
