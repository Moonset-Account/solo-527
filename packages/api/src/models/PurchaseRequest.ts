import mongoose, { Schema, Document, Model } from 'mongoose';
import { PurchaseRequest, MaterialItem, Attachment, PurchaseStatus } from '@app/shared';

const MaterialItemSchema = new Schema<MaterialItem>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  code: String,
  category: { type: String, required: true },
  specification: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  budgetPrice: Number,
  remark: String
}, { _id: false });

const AttachmentSchema = new Schema<Attachment>({
  id: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: String,
  size: Number,
  url: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, required: true }
}, { _id: false });

const PurchaseRequestSchema = new Schema<PurchaseRequest & Document>({
  code: { type: String, required: true, unique: true, index: true },
  projectName: { type: String, required: true },
  projectCode: { type: String, required: true },
  projectManagerId: { type: String, required: true },
  projectManagerName: { type: String, required: true },
  department: { type: String, required: true },
  items: [MaterialItemSchema],
  attachments: [AttachmentSchema],
  requiredDate: { type: Date, required: true },
  description: String,
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'quoting', 'comparing', 'approved', 'ordered', 'completed', 'cancelled'],
    default: 'draft' as PurchaseStatus 
  },
  currentQuoteCount: { type: Number, default: 0 },
  totalAmount: Number,
  selectedQuoteId: String,
  submittedAt: Date
}, {
  timestamps: true
});

PurchaseRequestSchema.index({ projectName: 'text', description: 'text', code: 'text' });
PurchaseRequestSchema.index({ status: 1, createdAt: -1 });

export const PurchaseRequestModel: Model<PurchaseRequest & Document> = 
  mongoose.model('PurchaseRequest', PurchaseRequestSchema);
