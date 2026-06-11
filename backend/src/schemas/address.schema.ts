import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({ timestamps: true, collection: 'addresses' })
export class Address {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: String, trim: true })
  contactName: string;

  @Prop({ required: true, type: String, trim: true })
  phone: string;

  @Prop({ required: true, type: String, trim: true })
  province: string;

  @Prop({ required: true, type: String, trim: true })
  city: string;

  @Prop({ required: true, type: String, trim: true })
  district: string;

  @Prop({ type: String, trim: true, default: '' })
  community: string;

  @Prop({ required: true, type: String, trim: true })
  detail: string;

  @Prop({ type: Number, default: 0 })
  lng: number;

  @Prop({ type: Number, default: 0 })
  lat: number;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
