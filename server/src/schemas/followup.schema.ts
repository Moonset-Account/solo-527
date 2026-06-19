import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type FollowupDocument = Followup & Document;

export enum FollowupType {
  PHONE = 'phone',
  WECHAT = 'wechat',
  VISIT = 'visit',
  OTHER = 'other',
}

export enum FollowupStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Followup {
  @ApiProperty({ description: '回访ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '关联线索ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Lead' })
  leadId: Types.ObjectId;

  @ApiProperty({ description: '关联车辆ID' })
  @Prop({ type: Types.ObjectId, ref: 'Vehicle' })
  vehicleId: Types.ObjectId;

  @ApiProperty({ description: '联系人姓名' })
  @Prop({ required: true })
  contactName: string;

  @ApiProperty({ description: '联系电话' })
  @Prop({ required: true })
  contactPhone: string;

  @ApiProperty({ description: '回访类型', enum: FollowupType })
  @Prop({ required: true, enum: FollowupType })
  type: FollowupType;

  @ApiProperty({ description: '状态', enum: FollowupStatus })
  @Prop({ required: true, enum: FollowupStatus, default: FollowupStatus.PENDING })
  status: FollowupStatus;

  @ApiProperty({ description: '回访结果' })
  @Prop()
  result: string;

  @ApiProperty({ description: '是否已预约' })
  @Prop({ default: false })
  appointmentMade: boolean;

  @ApiProperty({ description: '关联预约ID' })
  @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  appointmentId: Types.ObjectId;

  @ApiProperty({ description: '负责人ID' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigneeId: Types.ObjectId;

  @ApiProperty({ description: '计划回访时间' })
  @Prop({ required: true })
  scheduledAt: Date;

  @ApiProperty({ description: '完成时间' })
  @Prop()
  completedAt: Date;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const FollowupSchema = SchemaFactory.createForClass(Followup);
