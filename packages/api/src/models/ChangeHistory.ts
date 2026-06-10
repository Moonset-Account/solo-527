import mongoose, { Schema, Document, Model } from 'mongoose';
import { ChangeHistory, FieldChange, ChangeEntity } from '@app/shared';

const FieldChangeSchema = new Schema<FieldChange>({
  field: { type: String, required: true },
  fieldLabel: { type: String, required: true },
  oldValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed,
  type: { type: String, enum: ['primitive', 'array', 'object'], default: 'primitive' }
}, { _id: false });

const ChangeHistorySchema = new Schema<ChangeHistory & Document>({
  entityId: { type: String, required: true, index: true },
  entityType: { 
    type: String, 
    enum: ['purchase_request', 'quote', 'supplier', 'agreement'],
    required: true,
    index: true 
  },
  entityCode: { type: String, required: true },
  changes: [FieldChangeSchema],
  changedBy: { type: String, required: true },
  changedByName: { type: String, required: true },
  changeReason: String
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

ChangeHistorySchema.index({ entityId: 1, entityType: 1, createdAt: -1 });

export const ChangeHistoryModel: Model<ChangeHistory & Document> = 
  mongoose.model('ChangeHistory', ChangeHistorySchema);
