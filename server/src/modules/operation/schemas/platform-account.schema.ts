import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';
import { PlatformType } from '../../common/enums';

export type PlatformAccountDocument = PlatformAccount & Document;

@Schema({ collection: 'platform_accounts', timestamps: true })
export class PlatformAccount extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: PlatformType, required: true })
  platform: PlatformType;

  @Prop()
  accountId: string;

  @Prop()
  followers: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  operator: string;

  @Prop()
  remark?: string;
}

export const PlatformAccountSchema = SchemaFactory.createForClass(PlatformAccount);
