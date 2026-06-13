import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type SystemConfigDocument = SystemConfig & Document;

@Schema({ collection: 'system_configs', timestamps: true })
export class SystemConfig extends BaseSchema {
  @Prop({ required: true, unique: true })
  configKey: string;

  @Prop()
  configValue: string;

  @Prop()
  valueType: string;

  @Prop()
  description?: string;

  @Prop()
  configGroup: string;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
