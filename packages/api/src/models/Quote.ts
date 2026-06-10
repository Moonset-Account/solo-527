import mongoose, { Schema, Document, Model } from 'mongoose';
import { Quote, QuoteItem, QuoteStatus } from '@app/shared';

const QuoteItemSchema = new Schema<QuoteItem>({
  materialItemId: { type: String, required: true },
  name: { type: String, required: true },
  specification: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  deliveryDate: Date,
  remark: String
}, { _id: false });

const AttachmentRefSchema = new Schema({
  id: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: String,
  size: Number,
  url: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, required: true }
}, { _id: false });

const QuoteSchema = new Schema<Quote & Document>({
  code: { type: String, required: true, unique: true, index: true },
  purchaseRequestId: { type: String, required: true, index: true },
  supplierId: { type: String, required: true, index: true },
  supplierName: { type: String, required: true },
  items: [QuoteItemSchema],
  totalAmount: { type: Number, required: true },
  taxRate: Number,
  taxAmount: Number,
  totalWithTax: Number,
  paymentTerms: String,
  deliveryTerms: String,
  warranty: String,
  attachments: [AttachmentRefSchema],
  remark: String,
  status: { 
    type: String, 
    enum: ['submitted', 'reviewing', 'selected', 'rejected'],
    default: 'submitted' as QuoteStatus 
  },
  validityDate: { type: Date, required: true },
  submittedBy: { type: String, required: true },
  reviewedAt: Date
}, {
  timestamps: true
});

QuoteSchema.index({ purchaseRequestId: 1, status: 1 });
QuoteSchema.index({ supplierId: 1, createdAt: -1 });

export const QuoteModel: Model<Quote & Document> = 
  mongoose.model('Quote', QuoteSchema);
