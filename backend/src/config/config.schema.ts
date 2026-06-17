import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConfigStatus } from '../common/decorators/config-status.enum';

export enum ConfigCategory {
  BILLING = 'billing',
  MAINTENANCE = 'maintenance',
  INSPECTION = 'inspection',
  PRICING = 'pricing',
  ACCESS = 'access',
  SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class ConfigItem extends Document {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ConfigCategory })
  category: ConfigCategory;

  @Prop({ type: Object })
  value?: any;

  @Prop({ type: Object })
  defaultValue?: any;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: [{ date: Date, from: Object, to: Object, operator: { type: Types.ObjectId, ref: 'User' } }] })
  changeLogs: Array<{ date: Date; from: any; to: any; operator: Types.ObjectId }>;

  @Prop({ enum: ConfigStatus, default: ConfigStatus.DRAFT })
  status: ConfigStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ConfigItemSchema = SchemaFactory.createForClass(ConfigItem);
