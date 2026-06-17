import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SampleStatus } from '../../common/enums/index.enum';
import { AuditInfo, AuditInfoSchema } from '../../common/schemas/audit-info.schema';

export type SampleDocument = Sample & Document;

@Schema({ _id: false })
class SampleTracking {
  @Prop({ type: String, enum: Object.values(SampleStatus), required: true })
  status: SampleStatus;

  @Prop({ type: Date, default: Date.now })
  time: Date;

  @Prop({ type: String })
  operatorId: string;

  @Prop({ type: String })
  operatorName: string;

  @Prop({ type: String })
  location: string;

  @Prop({ type: String })
  remark: string;
}

const SampleTrackingSchema = SchemaFactory.createForClass(SampleTracking);

@Schema({ collection: 'samples', timestamps: true })
export class Sample {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  sampleCode: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  type: string;

  @Prop({ type: String })
  source: string;

  @Prop({ type: String })
  storageLocation: string;

  @Prop({ type: Number })
  quantity: number;

  @Prop({ type: String })
  unit: string;

  @Prop({ type: String, enum: Object.values(SampleStatus), default: SampleStatus.STORAGE, index: true })
  status: SampleStatus;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reagent' })
  relatedReagentId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Application', default: [] })
  relatedApplicationIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'OriginalDocument' })
  originalDocumentId: Types.ObjectId;

  @Prop({ type: String })
  currentHolderId: string;

  @Prop({ type: String })
  currentHolderName: string;

  @Prop({ type: Date })
  lastCheckedAt: Date;

  @Prop({ type: [SampleTrackingSchema], default: [] })
  trackingHistory: SampleTracking[];

  @Prop({ type: String })
  remarks: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const SampleSchema = SchemaFactory.createForClass(Sample);
SampleSchema.index({ projectId: 1, status: 1 });
