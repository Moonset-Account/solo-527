import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DictionaryItemDocument = DictionaryItem & Document;

@Schema({ timestamps: true })
export class DictionaryItem {
  @Prop({ required: true })
  dictType: string;

  @Prop({ required: true })
  dictLabel: string;

  @Prop({ required: true })
  dictValue: string;

  @Prop()
  description: string;

  @Prop()
  sort: number;

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const DictionaryItemSchema = SchemaFactory.createForClass(DictionaryItem);

DictionaryItemSchema.index({ dictType: 1, dictValue: 1 }, { unique: true });
