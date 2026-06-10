import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TechnicianDocument = Technician & Document;

export enum TechnicianStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REST = 'rest',
}

@Schema({ timestamps: true })
export class Technician {
  @Prop({ required: true })
  name: string;

  @Prop()
  userId: string;

  @Prop()
  phone: string;

  @Prop()
  avatar: string;

  @Prop()
  position: string;

  @Prop()
  description: string;

  @Prop({ type: [String] })
  skills: string[];

  @Prop({ type: [String] })
  serviceIds: string[];

  @Prop()
  workStartTime: string;

  @Prop()
  workEndTime: string;

  @Prop({ type: [Number] })
  workDays: number[];

  @Prop({ enum: TechnicianStatus, default: TechnicianStatus.ACTIVE })
  status: TechnicianStatus;

  @Prop()
  sort: number;
}

export const TechnicianSchema = SchemaFactory.createForClass(Technician);
