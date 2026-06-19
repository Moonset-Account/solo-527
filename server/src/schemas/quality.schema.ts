import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type QualityDocument = Quality & Document;

export enum QualityStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  QUALITY_CHECK = 'quality_check',
  COMPLETED = 'completed',
}

@Schema({ _id: false })
export class StatusHistoryItem {
  @ApiProperty({ description: '原状态' })
  @Prop({ required: true })
  fromStatus: string;

  @ApiProperty({ description: '新状态' })
  @Prop({ required: true })
  toStatus: string;

  @ApiProperty({ description: '操作人ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  operatorId: Types.ObjectId;

  @ApiProperty({ description: '操作人姓名' })
  @Prop({ required: true })
  operatorName: string;

  @ApiProperty({ description: '备注' })
  @Prop()
  remark: string;

  @ApiProperty({ description: '时间戳' })
  @Prop({ required: true })
  timestamp: Date;
}

@Schema({ timestamps: true })
export class Quality {
  @ApiProperty({ description: '质量记录ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '关联预约ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Appointment' })
  appointmentId: Types.ObjectId;

  @ApiProperty({ description: '关联车辆ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Vehicle' })
  vehicleId: Types.ObjectId;

  @ApiProperty({ description: '状态', enum: QualityStatus })
  @Prop({ required: true, enum: QualityStatus, default: QualityStatus.PENDING })
  status: QualityStatus;

  @ApiProperty({ description: '状态历史', type: [StatusHistoryItem] })
  @Prop({ type: [SchemaFactory.createForClass(StatusHistoryItem)], default: [] })
  statusHistory: StatusHistoryItem[];

  @ApiProperty({ description: '是否有爽约记录' })
  @Prop({ default: false })
  hasNoShow: boolean;

  @ApiProperty({ description: '爽约处理人ID' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  noShowHandledBy: Types.ObjectId;

  @ApiProperty({ description: '爽约处理时间' })
  @Prop()
  noShowHandledAt: Date;

  @ApiProperty({ description: '关联异常记录ID' })
  @Prop({ type: Types.ObjectId, ref: 'Exception' })
  exceptionId: Types.ObjectId;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const QualitySchema = SchemaFactory.createForClass(Quality);
