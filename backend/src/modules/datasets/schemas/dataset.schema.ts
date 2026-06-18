import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DatasetStatus = 'active' | 'archived';
export type PermissionLevel = 'read' | 'write' | 'manage';

export interface DatasetPermission {
  userId: Types.ObjectId;
  userName: string;
  level: PermissionLevel;
  expireAt?: Date;
}

export interface DatasetMetric {
  name: string;
  displayName: string;
  description?: string;
  unit?: string;
}

@Schema({ timestamps: true, collection: 'datasets' })
export class Dataset extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop()
  category: string;

  @Prop({ type: [Object], default: [] })
  metrics: DatasetMetric[];

  @Prop({ type: [Object], default: [] })
  permissions: DatasetPermission[];

  @Prop({
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
    index: true,
  })
  status: DatasetStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerId: Types.ObjectId;

  @Prop()
  ownerName: string;

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  sharedWithIds: Types.ObjectId[];

  @Prop()
  dataSource: string;

  @Prop({ default: 0 })
  anomalyCount: number;

  @Prop({ default: 0 })
  ruleCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const DatasetSchema = SchemaFactory.createForClass(Dataset);
DatasetSchema.index({ code: 1 }, { unique: true });
DatasetSchema.index({ status: 1, category: 1 });
