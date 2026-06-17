import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuditInfo, AuditInfoSchema } from '../../common/schemas/audit-info.schema';

export type ProjectDocument = Project & Document;

@Schema({ collection: 'projects', timestamps: true })
export class Project {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  projectNo: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String, index: true })
  principalInvestigatorId: string;

  @Prop({ type: String })
  principalInvestigatorName: string;

  @Prop({ type: [String], default: [] })
  memberIds: string[];

  @Prop({ type: String })
  department: string;

  @Prop({ type: String })
  fundingSource: string;

  @Prop({ type: Number })
  fundingAmount: number;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: String })
  status: string;

  @Prop({ type: [Types.ObjectId], ref: 'OriginalDocument', default: [] })
  relatedDocumentIds: Types.ObjectId[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.index({ principalInvestigatorId: 1 });

export type ProjectReportDocument = ProjectReport & Document;

@Schema({ collection: 'project_reports', timestamps: true })
export class ProjectReport {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: String, required: true })
  reportNo: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  reportType: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: String, required: true })
  authorId: string;

  @Prop({ type: String })
  authorName: string;

  @Prop({ type: [Types.ObjectId], ref: 'Application', default: [] })
  relatedApplicationIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Reagent', default: [] })
  relatedReagentIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'OriginalDocument', default: [] })
  relatedDocumentIds: Types.ObjectId[];

  @Prop({ type: Date })
  reportDate: Date;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const ProjectReportSchema = SchemaFactory.createForClass(ProjectReport);
