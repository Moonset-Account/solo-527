import mongoose, { Schema, Document, Model } from 'mongoose';
import { Alert, AlertType, AlertLevel, AlertStatus } from '@app/shared';

const AlertSchema = new Schema<Alert & Document>({
  type: { type: String, enum: ['price_surge', 'price_drop', 'qualification_expiring', 'qualification_expired', 'quote_deadline', 'agreement_expiring'], required: true },
  level: { type: String, enum: ['info', 'warning', 'critical'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: String,
  relatedType: String,
  recipientIds: [{ type: String, required: true }],
  status: { type: String, enum: ['unread', 'read', 'processed'], default: 'unread' as AlertStatus },
  processedBy: String,
  processedAt: Date,
  data: Schema.Types.Mixed
}, {
  timestamps: true
});

AlertSchema.index({ recipientIds: 1, status: 1, createdAt: -1 });
AlertSchema.index({ type: 1, level: 1 });

export const AlertModel: Model<Alert & Document> = mongoose.model('Alert', AlertSchema);
