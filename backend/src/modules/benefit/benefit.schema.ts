import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MemberLevel } from '../../common/enums';

export type BenefitDocument = Benefit & Document;

export enum BenefitType {
  COUPON = 'coupon',
  POINTS = 'points',
  SERVICE = 'service',
  GIFT = 'gift',
  DISCOUNT = 'discount',
}

@Schema({ timestamps: true })
export class Benefit {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: BenefitType })
  type: BenefitType;

  @Prop()
  description?: string;

  @Prop()
  icon?: string;

  @Prop()
  value?: string;

  @Prop({ type: [String], enum: MemberLevel, default: [] })
  applicableLevels: MemberLevel[];

  @Prop()
  validDays?: number;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: 0 })
  sort: number;

  @Prop()
  createdBy?: Types.ObjectId;
}

export const BenefitSchema = SchemaFactory.createForClass(Benefit);
