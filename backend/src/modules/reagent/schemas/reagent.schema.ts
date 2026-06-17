import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HazardousCategory } from '../../common/enums/index.enum';
import { AuditInfo, AuditInfoSchema } from '../../common/schemas/audit-info.schema';

export type ReagentDocument = Reagent & Document;

@Schema({ _id: false })
class StorageInfo {
  @Prop({ type: String })
  location: string;

  @Prop({ type: String })
  cabinet: string;

  @Prop({ type: Number })
  temperature: number;

  @Prop({ type: String })
  storageCondition: string;
}

@Schema({ collection: 'reagents', timestamps: true })
export class Reagent {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  name: string;

  @Prop({ type: String, index: true })
  nameEn: string;

  @Prop({ type: String })
  casNo: string;

  @Prop({ type: String })
  molecularFormula: string;

  @Prop({ type: Number })
  molecularWeight: number;

  @Prop({ type: String })
  category: string;

  @Prop({ type: String })
  purity: string;

  @Prop({ type: String })
  manufacturer: string;

  @Prop({ type: String, unique: true, sparse: true })
  batchNo: string;

  @Prop({ type: String, required: true })
  unit: string;

  @Prop({ type: Number, default: 0 })
  totalQuantity: number;

  @Prop({ type: Number, default: 0 })
  availableQuantity: number;

  @Prop({ type: Number, default: 0 })
  warningThreshold: number;

  @Prop({ type: Date })
  productionDate: Date;

  @Prop({ type: Date, required: true, index: true })
  expiryDate: Date;

  @Prop({ type: String })
  specification: string;

  @Prop({ type: String })
  grade: string;

  @Prop({ type: String, enum: Object.values(HazardousCategory) })
  hazardousCategory: HazardousCategory;

  @Prop({ type: Boolean, default: false })
  isHazardous: boolean;

  @Prop({ type: [String], default: [] })
  hazardLabels: string[];

  @Prop({ type: StorageInfo })
  storage: StorageInfo;

  @Prop({ type: String })
  safetyDataSheet: string;

  @Prop({ type: String })
  remarks: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [Types.ObjectId], ref: 'Project', default: [] })
  relatedProjects: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'OriginalDocument' })
  originalDocumentId: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const ReagentSchema = SchemaFactory.createForClass(Reagent);

ReagentSchema.index({ name: 1, batchNo: 1 });
ReagentSchema.index({ expiryDate: 1 });
ReagentSchema.index({ availableQuantity: 1 });
