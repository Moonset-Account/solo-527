import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuditInfo, AuditInfoSchema } from '../../common/schemas/audit-info.schema';

export type OriginalDocumentDocument = OriginalDocument & Document;

@Schema({ collection: 'original_documents', timestamps: true })
export class OriginalDocument {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  documentNo: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  documentType: string;

  @Prop({ type: String })
  source: string;

  @Prop({ type: Date })
  documentDate: Date;

  @Prop({ type: String })
  fileUrl: string;

  @Prop({ type: String })
  fileName: string;

  @Prop({ type: Number })
  fileSize: number;

  @Prop({ type: [Types.ObjectId], ref: 'Reagent', default: [] })
  relatedReagentIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Application', default: [] })
  relatedApplicationIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Sample', default: [] })
  relatedSampleIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Project', default: [] })
  relatedProjectIds: Types.ObjectId[];

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  uploadedBy: string;

  @Prop({ type: String })
  uploadedByName: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const OriginalDocumentSchema = SchemaFactory.createForClass(OriginalDocument);
OriginalDocumentSchema.index({ documentType: 1, createdAt: -1 });
