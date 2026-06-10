import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceDocument = Service & Document;

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  duration: number;

  @Prop()
  category: string;

  @Prop({ type: [String] })
  images: string[];

  @Prop({ enum: ServiceStatus, default: ServiceStatus.ACTIVE })
  status: ServiceStatus;

  @Prop()
  sort: number;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
