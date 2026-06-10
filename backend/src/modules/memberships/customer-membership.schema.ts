import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerMembershipDocument = CustomerMembership & Document;

export enum CustomerMembershipStatus {
  ACTIVE = 'active',
  USED_UP = 'used_up',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class CustomerMembership {
  @Prop({ required: true })
  customerId: string;

  @Prop()
  customerName: string;

  @Prop({ required: true })
  membershipId: string;

  @Prop()
  membershipName: string;

  @Prop({ required: true })
  purchasePrice: number;

  @Prop()
  remainingTimes: number;

  @Prop()
  remainingAmount: number;

  @Prop()
  expireDate: Date;

  @Prop({ enum: CustomerMembershipStatus, default: CustomerMembershipStatus.ACTIVE })
  status: CustomerMembershipStatus;

  @Prop()
  createdBy: string;

  @Prop()
  remark: string;
}

export const CustomerMembershipSchema = SchemaFactory.createForClass(CustomerMembership);
