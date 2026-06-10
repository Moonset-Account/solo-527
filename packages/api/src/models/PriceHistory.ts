import mongoose, { Schema, Document, Model } from 'mongoose';
import { PriceHistory, MaterialCategory } from '@app/shared';

const PriceHistorySchema = new Schema<PriceHistory & Document>({
  materialName: { type: String, required: true, index: true },
  specification: { type: String, required: true },
  category: { type: String, required: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  unit: { type: String, required: true },
  quantity: Number,
  quoteId: String,
  agreementId: String,
  effectiveDate: { type: Date, required: true, index: true }
}, {
  timestamps: true
});

PriceHistorySchema.index({ materialName: 1, specification: 1, effectiveDate: -1 });
PriceHistorySchema.index({ supplierId: 1, effectiveDate: -1 });

export const PriceHistoryModel: Model<PriceHistory & Document> = 
  mongoose.model('PriceHistory', PriceHistorySchema);
