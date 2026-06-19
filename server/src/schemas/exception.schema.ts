import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ExceptionDocument = Exception & Document;

export enum ExceptionSourceType {
  APPOINTMENT = 'appointment',
  QUALITY = 'quality',
  FOLLOWUP = 'followup',
  OTHER = 'other',
}

export enum ExceptionType {
  NO_SHOW = 'no_show',
  QUALITY_ISSUE = 'quality_issue',
  CUSTOMER_COMPLAINT = 'customer_complaint',
  OTHER = 'other',
}

export enum ExceptionLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ExceptionStatus {
  OPEN = 'open',
  PROCESSING = 'processing',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class Exception {
  @ApiProperty({ description: '异常记录ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '来源类型', enum: ExceptionSourceType })
  @Prop({ required: true, enum: ExceptionSourceType })
  sourceType: ExceptionSourceType;

  @ApiProperty({ description: '来源ID' })
  @Prop({ required: true, type: Types.ObjectId })
  sourceId: Types.ObjectId;

  @ApiProperty({ description: '来源编号' })
  @Prop({ required: true })
  sourceNo: string;

  @ApiProperty({ description: '异常类型', enum: ExceptionType })
  @Prop({ required: true, enum: ExceptionType })
  type: ExceptionType;

  @ApiProperty({ description: '异常描述' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: '严重程度', enum: ExceptionLevel })
  @Prop({ required: true, enum: ExceptionLevel, default: ExceptionLevel.MEDIUM })
  level: ExceptionLevel;

  @ApiProperty({ description: '状态', enum: ExceptionStatus })
  @Prop({ required: true, enum: ExceptionStatus, default: ExceptionStatus.OPEN })
  status: ExceptionStatus;

  @ApiProperty({ description: '负责人ID' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigneeId: Types.ObjectId;

  @ApiProperty({ description: '关闭原因' })
  @Prop()
  closeReason: string;

  @ApiProperty({ description: '关闭人ID' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedBy: Types.ObjectId;

  @ApiProperty({ description: '关闭时间' })
  @Prop()
  closedAt: Date;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const ExceptionSchema = SchemaFactory.createForClass(Exception);
