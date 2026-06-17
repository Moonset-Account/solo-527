import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConfigStatus } from '../common/decorators/config-status.enum';

export enum RoomStatus {
  OCCUPIED = 'occupied',
  VACANT = 'vacant',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export enum RoomType {
  STUDIO = 'studio',
  ONE_BED = 'one_bed',
  TWO_BED = 'two_bed',
  THREE_BED = 'three_bed',
  DELUXE = 'deluxe',
}

@Schema({ timestamps: true })
export class RoomPricing extends Document {
  @Prop({ required: true, unique: true })
  roomNo: string;

  @Prop({ required: true, enum: RoomType })
  roomType: RoomType;

  @Prop({ required: true, type: Number })
  floor: number;

  @Prop({ required: true, type: Number })
  area: number;

  @Prop({ required: true, enum: RoomStatus, default: RoomStatus.VACANT })
  status: RoomStatus;

  @Prop({ required: true, type: Number })
  monthlyRent: number;

  @Prop({ type: Number, default: 0 })
  deposit: number;

  @Prop({ type: Number })
  waterRate?: number;

  @Prop({ type: Number })
  electricityRate?: number;

  @Prop({ type: Number })
  managementFee?: number;

  @Prop({ type: String })
  description?: string;

  @Prop({ enum: ConfigStatus, default: ConfigStatus.ENABLED })
  configStatus: ConfigStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const RoomPricingSchema = SchemaFactory.createForClass(RoomPricing);
