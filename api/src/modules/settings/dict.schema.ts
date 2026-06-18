import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Dict {
  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  label: string;

  @Prop({ default: 0 })
  sort: number;

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type DictDocument = Dict & Document;
export const DictSchema = SchemaFactory.createForClass(Dict);

DictSchema.index({ category: 1, key: 1 }, { unique: true });
DictSchema.index({ category: 1 });
