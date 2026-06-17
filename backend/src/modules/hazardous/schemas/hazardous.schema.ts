import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HazardousCategory } from '@/common/enums/index.enum';
import { AuditInfo, AuditInfoSchema } from '@/common/schemas/audit-info.schema';

export type HazardousLabelDocument = HazardousLabel & Document;

@Schema({ collection: 'hazardous_labels', timestamps: true })
export class HazardousLabel {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  labelCode: string;

  @Prop({ type: String, enum: Object.values(HazardousCategory), required: true })
  category: HazardousCategory;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  symbol: string;

  @Prop({ type: String })
  hazardStatement: string;

  @Prop({ type: String })
  precautionStatement: string;

  @Prop({ type: [String], default: [] })
  ppeRequirements: string[];

  @Prop({ type: String })
  storageRequirement: string;

  @Prop({ type: String })
  disposalMethod: string;

  @Prop({ type: String })
  firstAid: string;

  @Prop({ type: String })
  spillHandling: string;

  @Prop({ type: [Types.ObjectId], ref: 'Reagent', default: [] })
  relatedReagentIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Application', default: [] })
  relatedApplicationIds: Types.ObjectId[];

  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const HazardousLabelSchema = SchemaFactory.createForClass(HazardousLabel);
