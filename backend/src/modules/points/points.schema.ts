import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PointsType } from '../../common/enums';

export type PointsRecordDocument = PointsRecord & Document;

@Schema({ timestamps: true })
export class PointsRecord {
  @Prop({ required: true })
  recordNo: string;

  @Prop({ type: Types.ObjectId, ref: 'Member', required: true })
  memberId: Types.ObjectId;

  @Prop()
  memberName?: string;

  @Prop()
  memberPhone?: string;

  @Prop({ required: true, enum: PointsType })
  type: PointsType;

  @Prop({ required: true })
  points: number;

  @Prop({ default: 0 })
  balanceAfter: number;

  @Prop()
  source?: string;

  @Prop()
  orderNo?: string;

  @Prop()
  storeId?: string;

  @Prop()
  storeName?: string;

  @Prop()
  operatorId?: string;

  @Prop()
  operatorName?: string;

  @Prop()
  remark?: string;

  @Prop()
  expireDate?: Date;
}

export const PointsRecordSchema = SchemaFactory.createForClass(PointsRecord);
