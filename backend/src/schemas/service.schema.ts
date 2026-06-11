import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true, collection: 'services' })
export class Service {
  _id: Types.ObjectId;

  @Prop({ required: true, type: String, trim: true })
  name: string;

  @Prop({ required: true, type: String, trim: true })
  category: string;

  @Prop({ required: true, type: Number })
  duration: number;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true, type: String, trim: true })
  unit: string;

  @Prop({ type: String, trim: true, default: '' })
  description: string;

  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
