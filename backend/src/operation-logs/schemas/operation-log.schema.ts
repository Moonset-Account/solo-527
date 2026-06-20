import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OperationType } from '../../common/enums/operation-type.enum';

export type OperationLogDocument = OperationLog & Document;

@Schema({ timestamps: true })
export class OperationLog {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: OperationType,
    required: true,
  })
  operationType: OperationType;

  @Prop({ required: true })
  module: string;

  @Prop({ type: Types.ObjectId })
  targetId?: Types.ObjectId;

  @Prop({ type: Object })
  details?: Record<string, any>;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const OperationLogSchema = SchemaFactory.createForClass(OperationLog);

OperationLogSchema.index({ userId: 1, createdAt: -1 });
OperationLogSchema.index({ module: 1, createdAt: -1 });
