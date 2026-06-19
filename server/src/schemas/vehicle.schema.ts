import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type VehicleDocument = Vehicle & Document;

@Schema({ timestamps: true })
export class Vehicle {
  @ApiProperty({ description: '车辆ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '车牌号' })
  @Prop({ required: true, unique: true })
  plateNumber: string;

  @ApiProperty({ description: '品牌' })
  @Prop({ required: true })
  brand: string;

  @ApiProperty({ description: '型号' })
  @Prop({ required: true })
  model: string;

  @ApiProperty({ description: '车架号' })
  @Prop()
  vin: string;

  @ApiProperty({ description: '车主姓名' })
  @Prop({ required: true })
  ownerName: string;

  @ApiProperty({ description: '车主电话' })
  @Prop({ required: true })
  ownerPhone: string;

  @ApiProperty({ description: '里程数' })
  @Prop({ type: Number, default: 0 })
  mileage: number;

  @ApiProperty({ description: '上次保养日期' })
  @Prop()
  lastMaintenanceDate: Date;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
