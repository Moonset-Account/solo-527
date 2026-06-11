import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export type OrderStatus =
  | 'pending'
  | 'dispatched'
  | 'arrived'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type SupplyDemandReason =
  | 'worker_shortage'
  | 'peak_hours'
  | 'address_remote'
  | 'none';

export class AddressSnapshot {
  @Prop({ type: String, trim: true })
  contactName: string;

  @Prop({ type: String, trim: true })
  phone: string;

  @Prop({ type: String, trim: true })
  province: string;

  @Prop({ type: String, trim: true })
  city: string;

  @Prop({ type: String, trim: true })
  district: string;

  @Prop({ type: String, trim: true })
  community: string;

  @Prop({ type: String, trim: true })
  detail: string;

  @Prop({ type: Number })
  lng: number;

  @Prop({ type: Number })
  lat: number;
}

export class OnTimeRecord {
  @Prop({ type: Boolean, default: false })
  scheduled: boolean;

  @Prop({ type: Boolean, default: false })
  arrived: boolean;

  @Prop({ type: Boolean, default: false })
  completed: boolean;
}

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  _id: Types.ObjectId;

  @Prop({ required: true, type: String, trim: true, unique: true, index: true })
  orderNo: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Service' })
  serviceId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Address' })
  addressId: Types.ObjectId;

  @Prop({ type: AddressSnapshot, required: true })
  addressSnapshot: AddressSnapshot;

  @Prop({ type: Types.ObjectId, ref: 'Worker' })
  workerId: Types.ObjectId;

  @Prop({ required: true, type: Date, index: true })
  scheduledAt: Date;

  @Prop({ type: Date })
  scheduledEndAt: Date;

  @Prop({ required: true, type: Number })
  duration: number;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({
    required: true,
    type: String,
    enum: [
      'pending',
      'dispatched',
      'arrived',
      'inProgress',
      'completed',
      'cancelled',
      'rescheduled',
    ],
    default: 'pending',
    index: true,
  })
  status: OrderStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  rescheduleCount: number;

  @Prop({ type: String, trim: true, default: '' })
  cancelReason: string;

  @Prop({ type: String, trim: true, default: '' })
  rescheduleReason: string;

  @Prop({
    type: String,
    enum: ['worker_shortage', 'peak_hours', 'address_remote', 'none'],
    default: 'none',
  })
  supplyDemandReason: SupplyDemandReason;

  @Prop({ type: Date })
  actualArrivedAt: Date;

  @Prop({ type: Date })
  actualStartedAt: Date;

  @Prop({ type: Date })
  actualCompletedAt: Date;

  @Prop({ type: OnTimeRecord, default: () => ({ scheduled: false, arrived: false, completed: false }) })
  onTimeRecord: OnTimeRecord;

  @Prop({ type: String, trim: true, default: '', index: true })
  community: string;

  @Prop({ type: String, trim: true, default: '' })
  operator: string;

  @Prop({ type: String, trim: true, default: '' })
  remark: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
