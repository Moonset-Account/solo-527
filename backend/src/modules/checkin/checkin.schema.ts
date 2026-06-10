import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CheckinRecordDocument = CheckinRecord & Document;

export enum CheckinStatus {
  PENDING = 'pending',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class CheckinRecord {
  @Prop({ required: true })
  appointmentId: string;

  @Prop()
  customerId: string;

  @Prop()
  customerName: string;

  @Prop()
  customerPhone: string;

  @Prop()
  technicianId: string;

  @Prop()
  technicianName: string;

  @Prop({ type: [Object] })
  services: Array<{
    serviceId: string;
    serviceName: string;
    price: number;
  }>;

  @Prop()
  appointmentDate: Date;

  @Prop()
  appointmentTime: string;

  @Prop()
  checkinTime: Date;

  @Prop()
  checkoutTime: Date;

  @Prop({ enum: CheckinStatus, default: CheckinStatus.PENDING })
  status: CheckinStatus;

  @Prop()
  totalAmount: number;

  @Prop()
  actualAmount: number;

  @Prop()
  discountAmount: number;

  @Prop()
  membershipId?: string;

  @Prop()
  membershipDeduction?: number;

  @Prop()
  paymentMethod: string;

  @Prop()
  cashierId: string;

  @Prop()
  cashierName: string;

  @Prop()
  checkedInBy: string;

  @Prop()
  completedBy: string;

  @Prop()
  remark: string;
}

export const CheckinRecordSchema = SchemaFactory.createForClass(CheckinRecord);
