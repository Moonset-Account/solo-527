import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConfigStatus } from '../common/decorators/config-status.enum';

export enum InspectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXCEPTION = 'exception',
}

@Schema({ timestamps: true })
export class Inspection extends Document {
  @Prop({ required: true, unique: true })
  taskNo: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  area: string;

  @Prop({ required: true, type: Date })
  scheduledAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  inspector?: Types.ObjectId;

  @Prop({ required: true, enum: InspectionStatus, default: InspectionStatus.PENDING })
  status: InspectionStatus;

  @Prop({ type: [{ item: String, result: String, remark: String, checkedAt: Date }] })
  checkItems: Array<{ item: string; result: string; remark?: string; checkedAt?: Date }>;

  @Prop({ type: String })
  conclusion?: string;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ enum: ConfigStatus, default: ConfigStatus.ENABLED })
  configStatus: ConfigStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const InspectionSchema = SchemaFactory.createForClass(Inspection);
