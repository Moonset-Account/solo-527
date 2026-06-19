import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type RuleDocument = Rule & Document;

@Schema({ _id: false })
export class ToggleHistoryItem {
  @ApiProperty({ description: '是否启用' })
  @Prop({ required: true })
  isEnabled: boolean;

  @ApiProperty({ description: '操作人ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  operatorId: Types.ObjectId;

  @ApiProperty({ description: '操作人姓名' })
  @Prop({ required: true })
  operatorName: string;

  @ApiProperty({ description: '生效时间' })
  @Prop()
  effectiveTime: Date;

  @ApiProperty({ description: '操作时间' })
  @Prop({ required: true })
  timestamp: Date;
}

@Schema({ timestamps: true })
export class Rule {
  @ApiProperty({ description: '规则ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '规则编码' })
  @Prop({ required: true, unique: true })
  code: string;

  @ApiProperty({ description: '规则名称' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: '规则描述' })
  @Prop()
  description: string;

  @ApiProperty({ description: '分类' })
  @Prop({ required: true })
  category: string;

  @ApiProperty({ description: '是否启用' })
  @Prop({ required: true, default: true })
  isEnabled: boolean;

  @ApiProperty({ description: '生效时间' })
  @Prop()
  effectiveTime: Date;

  @ApiProperty({ description: '过期时间' })
  @Prop()
  expiryTime: Date;

  @ApiProperty({ description: '规则配置' })
  @Prop({ type: Object })
  config: Record<string, any>;

  @ApiProperty({ description: '开关历史', type: [ToggleHistoryItem] })
  @Prop({ type: [SchemaFactory.createForClass(ToggleHistoryItem)], default: [] })
  toggleHistory: ToggleHistoryItem[];

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const RuleSchema = SchemaFactory.createForClass(Rule);
