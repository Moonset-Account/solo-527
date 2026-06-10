import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CouponStatus, CouponType } from '../../common/enums';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true })
  couponNo: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: CouponType })
  type: CouponType;

  @Prop({ type: Types.ObjectId, ref: 'Member' })
  memberId: Types.ObjectId;

  @Prop()
  memberName?: string;

  @Prop()
  memberPhone?: string;

  @Prop()
  value?: number;

  @Prop()
  threshold?: number;

  @Prop({ enum: CouponStatus, default: CouponStatus.UNUSED })
  status: CouponStatus;

  @Prop()
  validFrom?: Date;

  @Prop()
  validTo?: Date;

  @Prop()
  usedTime?: Date;

  @Prop()
  usedOrderNo?: string;

  @Prop()
  storeId?: string;

  @Prop()
  storeName?: string;

  @Prop()
  responsiblePerson?: string;

  @Prop()
  responsiblePersonId?: string;

  @Prop()
  remark?: string;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
