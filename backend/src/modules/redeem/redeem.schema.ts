import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RedeemStatus } from '../../common/enums';

export type RedeemRecordDocument = RedeemRecord & Document;

@Schema({ timestamps: true })
export class RedeemRecord {
  @Prop({ required: true, unique: true })
  redeemNo: string;

  @Prop({ type: Types.ObjectId, ref: 'Member', required: true })
  memberId: Types.ObjectId;

  @Prop()
  memberName?: string;

  @Prop()
  memberPhone?: string;

  @Prop({ required: true })
  benefitName: string;

  @Prop()
  benefitId?: string;

  @Prop({ required: true })
  pointsCost: number;

  @Prop({ enum: RedeemStatus, default: RedeemStatus.PENDING })
  status: RedeemStatus;

  @Prop()
  storeId?: string;

  @Prop()
  storeName?: string;

  @Prop()
  operatorId?: string;

  @Prop()
  operatorName?: string;

  @Prop()
  failReason?: string;

  @Prop()
  remark?: string;

  @Prop()
  redeemTime?: Date;
}

export const RedeemRecordSchema = SchemaFactory.createForClass(RedeemRecord);
