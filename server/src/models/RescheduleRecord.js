const mongoose = require('mongoose');

const rescheduleRecordSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderNo: {
    type: String,
    index: true
  },
  originalTime: {
    type: Date,
    required: true
  },
  newTime: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['customer_request', 'technician_unavailable', 'store_rearrange', 'other']
  },
  reasonDetail: {
    type: String,
    default: ''
  },
  operatorType: {
    type: String,
    enum: ['customer', 'cs', 'technician', 'admin'],
    default: 'cs'
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  operatorName: String,
  extraFee: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  remark: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'reschedule_records'
});

rescheduleRecordSchema.index({ orderId: 1, createdAt: -1 });
rescheduleRecordSchema.index({ reason: 1, status: 1 });

module.exports = mongoose.model('RescheduleRecord', rescheduleRecordSchema);
