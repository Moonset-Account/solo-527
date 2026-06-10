import mongoose, { Schema, Document, Model } from 'mongoose';
import { FrameworkAgreement, AgreementItem, AgreementStatus } from '@app/shared';

const AgreementItemSchema = new Schema<AgreementItem>({
  materialCode: String,
  name: { type: String, required: true },
  specification: { type: String, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  minQuantity: Number,
  maxQuantity: Number
}, { _id: false });

const FrameworkAgreementSchema = new Schema<FrameworkAgreement & Document>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  supplierId: { type: String, required: true, index: true },
  supplierName: { type: String, required: true },
  items: [AgreementItemSchema],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalAmount: Number,
  status: { 
    type: String, 
    enum: ['active', 'expired', 'terminated'],
    default: 'active' as AgreementStatus 
  },
  attachments: [{
    id: String,
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: String,
    uploadedAt: Date
  }],
  terms: String
}, {
  timestamps: true
});

FrameworkAgreementSchema.index({ supplierId: 1, status: 1 });
FrameworkAgreementSchema.index({ endDate: 1 });

export const FrameworkAgreementModel: Model<FrameworkAgreement & Document> = 
  mongoose.model('FrameworkAgreement', FrameworkAgreementSchema);
