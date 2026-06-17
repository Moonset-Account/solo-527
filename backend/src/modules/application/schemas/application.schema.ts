import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApplicationStatus, ApplicationType } from '../../common/enums/index.enum';
import { AuditInfo, AuditInfoSchema } from '../../common/schemas/audit-info.schema';

export type ApplicationItemDocument = ApplicationItem & Document;

@Schema({ _id: false })
export class ApplicationItem {
  @Prop({ type: Types.ObjectId, ref: 'Reagent', required: true })
  reagentId: Types.ObjectId;

  @Prop({ type: String, required: true })
  reagentName: string;

  @Prop({ type: String })
  reagentBatchNo: string;

  @Prop({ type: String })
  specification: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: String, required: true })
  unit: string;

  @Prop({ type: Number })
  actualQuantity: number;

  @Prop({ type: String })
  remarks: string;
}

export const ApplicationItemSchema = SchemaFactory.createForClass(ApplicationItem);

export type ApplicationDocument = Application & Document;

@Schema({ _id: false })
class ApplicationApproval {
  @Prop({ type: String })
  approverId: string;

  @Prop({ type: String })
  approverName: string;

  @Prop({ type: Date })
  approvedAt: Date;

  @Prop({ type: String })
  remark: string;
}

const ApplicationApprovalSchema = SchemaFactory.createForClass(ApplicationApproval);

@Schema({ collection: 'applications', timestamps: true })
export class Application {
  _id: Types.ObjectId;

  @Prop({ type: String, unique: true, required: true, index: true })
  applicationNo: string;

  @Prop({ type: String, enum: Object.values(ApplicationType), default: ApplicationType.REAGENT })
  type: ApplicationType;

  @Prop({ type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.DRAFT, index: true })
  status: ApplicationStatus;

  @Prop({ type: String, required: true, index: true })
  applicantId: string;

  @Prop({ type: String, required: true })
  applicantName: string;

  @Prop({ type: String })
  applicantDepartment: string;

  @Prop({ type: String })
  applicantLaboratory: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId: Types.ObjectId;

  @Prop({ type: String })
  projectName: string;

  @Prop({ type: [ApplicationItemSchema], required: true })
  items: ApplicationItem[];

  @Prop({ type: String })
  purpose: string;

  @Prop({ type: Date })
  expectedPickDate: Date;

  @Prop({ type: String })
  pickLocation: string;

  @Prop({ type: String })
  contactPhone: string;

  @Prop({ type: ApplicationApprovalSchema })
  approval: ApplicationApproval;

  @Prop({ type: String })
  rejectReason: string;

  @Prop({ type: Date })
  pickedAt: Date;

  @Prop({ type: String })
  pickedBy: string;

  @Prop({ type: String })
  pickedByName: string;

  @Prop({ type: Date })
  returnedAt: Date;

  @Prop({ type: String })
  returnedBy: string;

  @Prop({ type: Types.ObjectId, ref: 'InstrumentBooking' })
  relatedInstrumentBookingId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'HazardousLabel', default: [] })
  relatedHazardousLabelIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Sample', default: [] })
  relatedSampleIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'OriginalDocument' })
  originalDocumentId: Types.ObjectId;

  @Prop({ type: String })
  remarks: string;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

ApplicationSchema.index({ applicantId: 1, createdAt: -1 });
ApplicationSchema.index({ status: 1, createdAt: -1 });
ApplicationSchema.index({ applicationNo: 1 });
