import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReachType, ReachStatus } from '../../common/enums';

export type ReachLogDocument = ReachLog & Document;

@Schema({ timestamps: true })
export class ReachLog {
  @Prop({ required: true, unique: true })
  logNo: string;

  @Prop({ required: true, enum: ReachType })
  type: ReachType;

  @Prop({ type: Types.ObjectId, ref: 'Member' })
  memberId?: Types.ObjectId;

  @Prop()
  memberName?: string;

  @Prop()
  memberPhone?: string;

  @Prop()
  templateId?: string;

  @Prop()
  templateName?: string;

  @Prop()
  content?: string;

  @Prop({ enum: ReachStatus, default: ReachStatus.PENDING })
  status: ReachStatus;

  @Prop()
  failReason?: string;

  @Prop()
  failCode?: string;

  @Prop()
  provider?: string;

  @Prop()
  providerMsgId?: string;

  @Prop()
  storeId?: string;

  @Prop()
  storeName?: string;

  @Prop()
  operatorId?: string;

  @Prop()
  operatorName?: string;

  @Prop()
  sendTime?: Date;

  @Prop()
  receiveTime?: Date;

  @Prop()
  envLabel?: string;

  @Prop({ type: Object })
  extra?: Record<string, any>;
}

export const ReachLogSchema = SchemaFactory.createForClass(ReachLog);
