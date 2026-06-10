import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CashierRecordDocument = CashierRecord & Document;

export enum PaymentMethod {
  CASH = 'cash',
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  CARD = 'card',
  MEMBERSHIP = 'membership',
  OTHER = 'other',
}

export enum CashierType {
  SERVICE = 'service',
  MEMBERSHIP = 'membership',
  PRODUCT = 'product',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class CashierRecord {
  @Prop({ required: true })
  orderNo: string;

  @Prop({ enum: CashierType, required: true })
  type: CashierType;

  @Prop()
  customerId: string;

  @Prop()
  customerName: string;

  @Prop()
  customerPhone: string;

  @Prop()
  appointmentId?: string;

  @Prop()
  membershipId?: string;

  @Prop()
  membershipName?: string;

  @Prop({ type: [Object] })
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;

  @Prop({ required: true })
  totalAmount: number;

  @Prop()
  discountAmount: number;

  @Prop({ required: true })
  actualAmount: number;

  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop()
  remark: string;

  @Prop({ required: true })
  cashierId: string;

  @Prop()
  cashierName: string;

  @Prop()
  refunded: boolean;

  @Prop()
  refundAmount: number;

  @Prop()
  refundAt: Date;

  @Prop()
  refundBy: string;
}

export const CashierRecordSchema = SchemaFactory.createForClass(CashierRecord);
