import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum BillType {
  RENT = 'rent',
  WATER = 'water',
  ELECTRICITY = 'electricity',
  GAS = 'gas',
  NETWORK = 'network',
  PROPERTY = 'property',
  OTHER = 'other',
}

export enum BillStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Bill extends Document {
  @Prop({ required: true, unique: true })
  billNo: string;

  @Prop({ required: true, enum: BillType })
  type: BillType;

  @Prop({ required: true })
  roomNo: string;

  @Prop({ required: true })
  residentName: string;

  @Prop({ type: String })
  residentPhone?: string;

  @Prop({ required: true, type: Number })
  totalAmount: number;

  @Prop({ type: Number, default: 0 })
  paidAmount: number;

  @Prop({ type: Number, default: 0 })
  unpaidAmount: number;

  @Prop({ required: true })
  billingPeriod: string;

  @Prop({ required: true, type: Date })
  dueDate: Date;

  @Prop({ required: true, enum: BillStatus, default: BillStatus.UNPAID })
  status: BillStatus;

  @Prop({ type: [{ date: Date, amount: Number, paidBy: Types.ObjectId, method: String, remark: String }], default: [] })
  paymentRecords: Array<{
    date: Date;
    amount: number;
    paidBy: Types.ObjectId;
    method: string;
    remark?: string;
  }>;

  @Prop({ type: String })
  remark?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const BillSchema = SchemaFactory.createForClass(Bill);
