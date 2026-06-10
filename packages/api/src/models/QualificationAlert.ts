import mongoose, { Schema, Document, Model } from 'mongoose';
import { QualificationAlert, QualificationAlertStatus, ApprovalBoardItem, DashboardStatus } from '@app/shared';

const QualificationAlertSchema = new Schema<QualificationAlert & Document>({
  supplierId: { type: String, required: true, index: true },
  supplierName: { type: String, required: true },
  qualificationName: { type: String, required: true },
  issueType: { type: String, enum: ['expiring', 'expired', 'invalid'], required: true },
  expiryDate: { type: Date, required: true },
  daysLeft: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'resolved'],
    default: 'pending' as QualificationAlertStatus,
    index: true
  },
  assigneeId: String,
  assigneeName: String,
  resolution: String,
  respondedAt: Date,
  resolvedAt: Date,
  approvalDurationHours: Number
}, {
  timestamps: true
});

QualificationAlertSchema.index({ status: 1, createdAt: -1 });
QualificationAlertSchema.index({ assigneeId: 1, status: 1 });

export const QualificationAlertModel: Model<QualificationAlert & Document> = 
  mongoose.model('QualificationAlert', QualificationAlertSchema);

const ApprovalBoardItemSchema = new Schema<ApprovalBoardItem & Document>({
  alertId: { type: String, required: true, unique: true, index: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  qualificationName: { type: String, required: true },
  issueType: { type: String, required: true },
  assigneeId: { type: String, required: true, index: true },
  assigneeName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' as DashboardStatus 
  },
  receivedAt: { type: Date, required: true },
  processedAt: Date,
  durationHours: { type: Number, required: true, default: 0 },
  remark: String
}, {
  timestamps: true
});

ApprovalBoardItemSchema.index({ assigneeId: 1, status: 1 });
ApprovalBoardItemSchema.index({ receivedAt: -1 });

export const ApprovalBoardItemModel: Model<ApprovalBoardItem & Document> = 
  mongoose.model('ApprovalBoardItem', ApprovalBoardItemSchema);
