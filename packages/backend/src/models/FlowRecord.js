const mongoose = require('mongoose');

const flowRecordSchema = new mongoose.Schema({
  recordType: {
    type: String,
    enum: ['pet_profile', 'adoption_application', 'training_record', 'adoption_review', 'visit_record'],
    required: true
  },
  relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
  relatedNo: String,
  action: {
    type: String,
    enum: ['create', 'update', 'status_change', 'submit', 'review', 'complete', 'cancel'],
    required: true
  },
  actionLabel: String,
  beforeData: mongoose.Schema.Types.Mixed,
  afterData: mongoose.Schema.Types.Mixed,
  changedFields: [String],
  description: String,
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  operatorName: String,
  operatorRole: String,
  remark: String
}, {
  timestamps: true
});

flowRecordSchema.index({ relatedId: 1, createdAt: -1 });
flowRecordSchema.index({ recordType: 1, createdAt: -1 });
flowRecordSchema.index({ operatorId: 1, createdAt: -1 });

module.exports = mongoose.model('FlowRecord', flowRecordSchema);
