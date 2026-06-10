import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MembershipDocument = Membership & Document;

export enum MembershipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export enum MembershipType {
  TIMES = 'times',
  AMOUNT = 'amount',
  DURATION = 'duration',
}

@Schema({ timestamps: true })
export class Membership {
  @Prop({ required: true })
  name: string;

  @Prop({ enum: MembershipType, required: true })
  type: MembershipType;

  @Prop({ required: true })
  price: number;

  @Prop()
  originalPrice: number;

  @Prop()
  totalTimes: number;

  @Prop()
  totalAmount: number;

  @Prop()
  durationDays: number;

  @Prop()
  description: string;

  @Prop({ type: [String] })
  serviceIds: string[];

  @Prop({ enum: MembershipStatus, default: MembershipStatus.ACTIVE })
  status: MembershipStatus;

  @Prop()
  sort: number;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);
