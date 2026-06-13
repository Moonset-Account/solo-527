import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SystemConfigDocument = SystemConfig & Document;

@Schema({ collection: 'system_configs', timestamps: true })
export class SystemConfig {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  configKey: string;

  @Prop()
  configValue: string;

  @Prop()
  valueType: string;

  @Prop()
  description: string;

  @Prop()
  configGroup: string;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
