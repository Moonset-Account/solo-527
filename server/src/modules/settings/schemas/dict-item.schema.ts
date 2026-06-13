import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type DictItemDocument = DictItem & Document;

@Schema({ collection: 'dict_items', timestamps: true })
export class DictItem extends BaseSchema {
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
  remark?: string;
}

export const DictItemSchema = SchemaFactory.createForClass(DictItem);
