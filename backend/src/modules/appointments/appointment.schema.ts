import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface AppointmentService {
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
}

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ required: true })
  customerId: string;

  @Prop()
  customerName: string;

  @Prop()
  customerPhone: string;

  @Prop({ required: true })
  technicianId: string;

  @Prop()
  technicianName: string;

  @Prop({ type: [Object], required: true })
  services: AppointmentService[];

  @Prop({ required: true })
  appointmentDate: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop()
  endTime: string;

  @Prop({ required: true })
  totalPrice: number;

  @Prop()
  totalDuration: number;

  @Prop({ enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @Prop()
  remark: string;

  @Prop()
  source: string;

  @Prop()
  membershipId?: string;

  @Prop()
  discountAmount?: number;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;

  @Prop()
  checkedInAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
