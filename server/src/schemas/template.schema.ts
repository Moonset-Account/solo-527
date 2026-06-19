import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TemplateDocument = Template & Document;

@Schema({ _id: false })
export class TemplateItem {
  @ApiProperty({ description: '检测项名称' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: '检测标准' })
  @Prop({ required: true })
  standard: string;

  @ApiProperty({ description: '单位' })
  @Prop()
  unit: string;

  @ApiProperty({ description: '最小值' })
  @Prop({ type: Number })
  minValue: number;

  @ApiProperty({ description: '最大值' })
  @Prop({ type: Number })
  maxValue: number;
}

@Schema({ timestamps: true })
export class Template {
  @ApiProperty({ description: '模板ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '模板名称' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: '分类' })
  @Prop({ required: true })
  category: string;

  @ApiProperty({ description: '检测项列表', type: [TemplateItem] })
  @Prop({ type: [SchemaFactory.createForClass(TemplateItem)], default: [] })
  items: TemplateItem[];

  @ApiProperty({ description: '是否启用' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
