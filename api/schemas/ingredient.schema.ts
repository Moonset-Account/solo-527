import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'ingredients' })
export class Ingredient extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true, default: 0 })
  currentStock: number;

  @Prop({ required: true, default: 0 })
  minStock: number;

  @Prop({ required: true })
  costPerUnit: number;

  @Prop({ type: [{ cost: Number, date: Date }] })
  costHistory: { cost: number; date: Date }[];

  @Prop({ default: false })
  isSandbox: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const IngredientSchema = SchemaFactory.createForClass(Ingredient);
