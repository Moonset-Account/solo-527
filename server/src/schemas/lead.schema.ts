import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type LeadDocument = Lead & Document;

export enum LeadStatus {
  NEW = 'new',
  FOLLOWING = 'following',
  APPOINTED = 'appointed',
  COMPLETED = 'completed',
  LOST = 'lost',
}

export enum LeadIntention {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Schema({ timestamps: true })
export class Lead {
  @ApiProperty({ description: '线索ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '客户姓名' })
  @Prop({ required: true })
  customerName: string;

  @ApiProperty({ description: '联系电话' })
  @Prop({ required: true })
  phone: string;

  @ApiProperty({ description: '线索来源' })
  @Prop({ required: true })
  source: string;

  @ApiProperty({ description: '意向度', enum: LeadIntention })
  @Prop({ required: true, enum: LeadIntention })
  intention: LeadIntention;

  @ApiProperty({ description: '状态', enum: LeadStatus })
  @Prop({ required: true, enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @ApiProperty({ description: '负责人ID' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigneeId: Types.ObjectId;

  @ApiProperty({ description: '负责人姓名' })
  @Prop()
  assigneeName: string;

  @ApiProperty({ description: '关联车辆ID' })
  @Prop({ type: Types.ObjectId, ref: 'Vehicle' })
  vehicleId: Types.ObjectId;

  @ApiProperty({ description: '分配时间' })
  @Prop()
  assignedAt: Date;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
