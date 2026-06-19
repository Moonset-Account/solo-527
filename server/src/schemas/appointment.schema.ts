import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type AppointmentDocument = Appointment & Document;

export enum AppointmentType {
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  OTHER = 'other',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Schema({ timestamps: true })
export class Appointment {
  @ApiProperty({ description: '预约ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '关联线索ID' })
  @Prop({ type: Types.ObjectId, ref: 'Lead' })
  leadId: Types.ObjectId;

  @ApiProperty({ description: '关联车辆ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Vehicle' })
  vehicleId: Types.ObjectId;

  @ApiProperty({ description: '客户姓名' })
  @Prop({ required: true })
  customerName: string;

  @ApiProperty({ description: '联系电话' })
  @Prop({ required: true })
  phone: string;

  @ApiProperty({ description: '预约类型', enum: AppointmentType })
  @Prop({ required: true, enum: AppointmentType })
  type: AppointmentType;

  @ApiProperty({ description: '状态', enum: AppointmentStatus })
  @Prop({ required: true, enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @ApiProperty({ description: '预约日期' })
  @Prop({ required: true })
  scheduledDate: Date;

  @ApiProperty({ description: '检测模板ID' })
  @Prop({ type: Types.ObjectId, ref: 'Template' })
  templateId: Types.ObjectId;

  @ApiProperty({ description: '爽约原因' })
  @Prop()
  noShowReason: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
