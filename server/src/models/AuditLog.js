import mongoose from 'mongoose';

const changeDetailSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
  },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  oldLabel: String,
  newLabel: String,
});

const auditLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: true,
    enum: ['material', 'article', 'schedule', 'exception', 'dictionary', 'user'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  entityTitle: String,
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'status_change', 'assign', 'publish'],
  },
  changes: [changeDetailSchema],
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  operatorName: String,
  operatorRole: String,
  ip: String,
  userAgent: String,
  remark: String,
}, {
  timestamps: true,
});

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ operatorId: 1 });
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
