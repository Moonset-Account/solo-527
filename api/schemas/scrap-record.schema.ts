import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'scrap_records' })
export class ScrapRecord extends Document {
  @Prop({ required: true })
  batchId: string;

  @Prop({ required: true })
  batchNo: string;

  @Prop({ required: true })
  ingredientId: string;

  @Prop({ required: true })
  ingredientName: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  reason: string;

  @Prop()
  operator: string;

  @Prop({ default: false })
  isSandbox: boolean;
}

export const ScrapRecordSchema = SchemaFactory.createForClass(ScrapRecord);
