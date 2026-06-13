import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DictItemDocument = DictItem & Document;

@Schema({ collection: 'dict_items', timestamps: true })
export class DictItem {
  _id: Types.ObjectId;

  @Prop({ required: true })
  dictCode: string;

  @Prop({ required: true })
  dictName: string;

  @Prop({ required: true })
  itemValue: string;

  @Prop({ required: true })
  itemLabel: string;

  @Prop({ default: 0 })
  sort: number;

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  remark: string;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const DictItemSchema = SchemaFactory.createForClass(DictItem);
