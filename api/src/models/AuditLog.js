import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  category: {
    type: String,
    enum: ['auth', 'equipment_down', 'key_field_change', 'status_change', 'batch', 'risk', 'system'],
    required: true,
    index: true
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  username: { type: String },
  userRole: { type: String },
  targetModel: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetNo: { type: String },
  fieldChanges: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  detail: { type: String },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

AuditLogSchema.index({ category: 1, timestamp: -1 });

export default mongoose.model('AuditLog', AuditLogSchema);
