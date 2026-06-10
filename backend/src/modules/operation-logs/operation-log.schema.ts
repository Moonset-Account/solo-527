import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OperationLogDocument = OperationLog & Document;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  QUERY = 'query',
  LOGIN = 'login',
  LOGOUT = 'logout',
  CHECKIN = 'checkin',
  CHECKOUT = 'checkout',
  PAYMENT = 'payment',
  REFUND = 'refund',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class OperationLog {
  @Prop({ required: true })
  operatorId: string;

  @Prop()
  operatorName: string;

  @Prop()
  operatorRole: string;

  @Prop({ enum: OperationType, required: true })
  operationType: OperationType;

  @Prop({ required: true })
  module: string;

  @Prop()
  targetId: string;

  @Prop()
  targetName: string;

  @Prop()
  description: string;

  @Prop({ type: Object })
  beforeData: Record<string, any>;

  @Prop({ type: Object })
  afterData: Record<string, any>;

  @Prop()
  ip: string;

  @Prop()
  userAgent: string;
}

export const OperationLogSchema = SchemaFactory.createForClass(OperationLog);

OperationLogSchema.index({ operatorId: 1, createdAt: -1 });
OperationLogSchema.index({ module: 1, createdAt: -1 });
