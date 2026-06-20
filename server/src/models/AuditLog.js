const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'status_change', 'assign', 'refund', 'reschedule', 'restore', 'login', 'logout', 'other'],
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['service', 'pricing_rule', 'technician', 'part', 'order', 'reschedule', 'refund', 'satisfaction', 'user', 'other'],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  entityName: {
    type: String,
    default: ''
  },
  beforeData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  afterData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  changedFields: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  operatorName: {
    type: String,
    default: '系统'
  },
  operatorRole: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  remark: {
    type: String,
    default: ''
  },
  requestId: {
    type: String,
    index: true
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, entityType: 1, createdAt: -1 });
auditLogSchema.index({ operatorId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
