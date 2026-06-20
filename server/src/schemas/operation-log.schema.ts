import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class OperationLog extends Document {
  @Prop({ required: true })
  module: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  operatorId: string;

  @Prop({ required: true })
  operatorName: string;

  @Prop()
  detail: string;

  @Prop({ required: true, enum: ['sandbox', 'production'], default: 'sandbox' })
  environment: string;
}

export const OperationLogSchema = SchemaFactory.createForClass(OperationLog);
