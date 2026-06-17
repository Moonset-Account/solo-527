import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DictionaryType } from '../../common/enums/index.enum';
import { AuditInfo, AuditInfoSchema } from '../../common/schemas/audit-info.schema';

export type DictionaryItemDocument = DictionaryItem & Document;

@Schema({ _id: false })
class DictionaryItem {
  @Prop({ type: String, required: true })
  value: string;

  @Prop({ type: String, required: true })
  label: string;

  @Prop({ type: Number, default: 0 })
  sort: number;

  @Prop({ type: Object })
  extra?: Record<string, any>;

  @Prop({ type: Boolean, default: true })
  enabled: boolean;
}

export const DictionaryItemSchema = SchemaFactory.createForClass(DictionaryItem);

export type DictionaryDocument = Dictionary & Document;

@Schema({ collection: 'dictionaries', timestamps: true })
export class Dictionary {
  _id: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(DictionaryType), required: true, index: true })
  type: DictionaryType;

  @Prop({ type: String, required: true, unique: true, index: true })
  code: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: [DictionaryItemSchema], default: [] })
  items: DictionaryItem[];

  @Prop({ type: [String], default: [] })
  scope: string[];

  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const DictionarySchema = SchemaFactory.createForClass(Dictionary);
