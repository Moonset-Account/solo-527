import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ScopeConfig {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['department', 'role', 'source'] })
  type: string;

  @Prop({ type: [String], default: [] })
  values: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type ScopeConfigDocument = ScopeConfig & Document;
export const ScopeConfigSchema = SchemaFactory.createForClass(ScopeConfig);

ScopeConfigSchema.index({ type: 1 });
