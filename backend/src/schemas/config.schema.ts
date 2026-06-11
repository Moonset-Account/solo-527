import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type ConfigDocument = Config & Document;

export class ChangeLogItem {
  @Prop({ type: MongooseSchema.Types.Mixed })
  oldValue: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  newValue: any;

  @Prop({ type: String, trim: true })
  modifiedBy: string;

  @Prop({ type: Date, default: Date.now })
  modifiedAt: Date;
}

export type ChangeLog = ChangeLogItem;

@Schema({ timestamps: true, collection: 'configs' })
export class Config {
  _id: Types.ObjectId;

  @Prop({ required: true, type: String, trim: true, unique: true, index: true })
  key: string;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  value: any;

  @Prop({ required: true, type: String, trim: true })
  type: string;

  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  @Prop({ type: String, trim: true, default: '' })
  remark: string;

  @Prop({ type: String, trim: true, default: '' })
  modifiedBy: string;

  @Prop({ type: Number, default: 1, min: 1 })
  version: number;

  @Prop({ type: [ChangeLogItem], default: [] })
  changeLog: ChangeLogItem[];

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
