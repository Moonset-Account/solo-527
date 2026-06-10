import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ActivityType } from '../../common/enums';

export type ActivityRecordDocument = ActivityRecord & Document;

@Schema({ timestamps: true })
export class ActivityRecord {
  @Prop({ required: true, unique: true })
  activityNo: string;

  @Prop({ type: Types.ObjectId, ref: 'Member', required: true })
  memberId: Types.ObjectId;

  @Prop()
  memberName?: string;

  @Prop()
  memberPhone?: string;

  @Prop({ required: true, enum: ActivityType })
  type: ActivityType;

  @Prop()
  description?: string;

  @Prop()
  storeId?: string;

  @Prop()
  storeName?: string;

  @Prop()
  productId?: string;

  @Prop()
  productName?: string;

  @Prop()
  orderNo?: string;

  @Prop()
  amount?: number;

  @Prop()
  points?: number;

  @Prop()
  duration?: number;

  @Prop()
  source?: string;

  @Prop()
  deviceInfo?: string;

  @Prop()
  ip?: string;
}

export const ActivityRecordSchema = SchemaFactory.createForClass(ActivityRecord);
