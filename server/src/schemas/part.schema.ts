import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PartDocument = Part & Document;

@Schema({ timestamps: true })
export class Part {
  @ApiProperty({ description: '配件ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '配件编码' })
  @Prop({ required: true, unique: true })
  code: string;

  @ApiProperty({ description: '配件名称' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: '品牌' })
  @Prop({ required: true })
  brand: string;

  @ApiProperty({ description: '适用车型' })
  @Prop({ required: true })
  model: string;

  @ApiProperty({ description: '价格' })
  @Prop({ required: true, type: Number })
  price: number;

  @ApiProperty({ description: '库存数量' })
  @Prop({ required: true, type: Number, default: 0 })
  stock: number;

  @ApiProperty({ description: '单位' })
  @Prop({ required: true })
  unit: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const PartSchema = SchemaFactory.createForClass(Part);
