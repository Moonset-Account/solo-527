import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlatformType } from '@/common/enums';

export type PlatformAccountDocument = PlatformAccount & Document;

@Schema({ collection: 'platform_accounts', timestamps: true })
export class PlatformAccount {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: PlatformType, required: true })
  platform: PlatformType;

  @Prop()
  accountId: string;

  @Prop({ default: 0 })
  followers: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  operator: string;

  @Prop()
  remark: string;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const PlatformAccountSchema = SchemaFactory.createForClass(PlatformAccount);
