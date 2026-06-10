import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MemberLevel } from '../../common/enums';

export type MemberDocument = Member & Document;

@Schema({ timestamps: true })
export class Member {
  @Prop({ required: true, unique: true })
  memberNo: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop()
  avatar?: string;

  @Prop({ required: true, enum: MemberLevel, default: MemberLevel.BRONZE })
  level: MemberLevel;

  @Prop({ default: 0 })
  totalPoints: number;

  @Prop({ default: 0 })
  availablePoints: number;

  @Prop({ default: 0 })
  totalConsumption: number;

  @Prop({ default: 0 })
  orderCount: number;

  @Prop()
  lastActiveTime?: Date;

  @Prop()
  registerTime?: Date;

  @Prop()
  storeId?: string;

  @Prop()
  storeName?: string;

  @Prop({ default: true })
  active: boolean;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
