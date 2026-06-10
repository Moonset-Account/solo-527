import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingDocument = Setting & Document;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop()
  value: string;

  @Prop()
  description: string;

  @Prop()
  group: string;

  @Prop()
  sort: number;

  @Prop()
  updatedBy: string;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
