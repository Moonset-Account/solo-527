import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MemberLevel } from '../../common/enums';

export type LevelRuleDocument = LevelRule & Document;

@Schema({ timestamps: true })
export class LevelRule {
  @Prop({ required: true, unique: true, enum: MemberLevel })
  level: MemberLevel;

  @Prop({ required: true })
  levelName: string;

  @Prop({ default: 0 })
  minPoints: number;

  @Prop({ default: 0 })
  minConsumption: number;

  @Prop({ default: 0 })
  minOrderCount: number;

  @Prop()
  icon?: string;

  @Prop()
  color?: string;

  @Prop()
  description?: string;

  @Prop({ default: 1 })
  pointsMultiplier: number;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: 0 })
  sort: number;
}

export const LevelRuleSchema = SchemaFactory.createForClass(LevelRule);
