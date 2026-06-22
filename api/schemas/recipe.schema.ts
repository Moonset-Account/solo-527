import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'recipes' })
export class Recipe extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, type: [{ ingredientId: String, ingredientName: String, ratio: Number, unit: String }] })
  ingredients: { ingredientId: string; ingredientName: string; ratio: number; unit: string }[];

  @Prop({ required: true })
  yield: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true, default: 0 })
  standardCost: number;

  @Prop({ type: [{ field: String, oldValue: String, newValue: String, changedAt: Date }], default: [] })
  history: { field: string; oldValue: string; newValue: string; changedAt: Date }[];

  @Prop({ default: false })
  isSandbox: boolean;
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);
