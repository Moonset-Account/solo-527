const mongoose = require('mongoose');

const operationLogSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    trim: true
  },
  module: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  targetType: {
    type: String,
    trim: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  description: {
    type: String,
    trim: true
  },
  fieldChanges: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  ip: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  requestUrl: {
    type: String,
    trim: true
  },
  requestMethod: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

operationLogSchema.index({ store: 1, createdAt: -1 });
operationLogSchema.index({ user: 1, createdAt: -1 });
operationLogSchema.index({ module: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('OperationLog', operationLogSchema);
