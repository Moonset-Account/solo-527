const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
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
  refundNo: {
    type: String,
    unique: true,
    index: true
  },
  refundType: {
    type: String,
    required: true,
    enum: ['full_refund', 'partial_refund', 'service_fee_refund', 'parts_refund', 'other']
  },
  refundReason: {
    type: String,
    required: true,
    enum: ['cancelled_before_service', 'service_not_satisfied', 'repair_failed', 'duplicate_charge', 'price_dispute', 'other']
  },
  reasonDetail: {
    type: String,
    default: ''
  },
  orderAmount: {
    type: Number,
    default: 0
  },
  refundAmount: {
    type: Number,
    required: true,
    min: 0
  },
  partsReturned: {
    type: Boolean,
    default: false
  },
  returnedParts: [{
    partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Part' },
    partName: String,
    quantity: Number,
    refundAmount: Number
  }],
  refundMethod: {
    type: String,
    enum: ['original_payment', 'cash', 'transfer', 'other'],
    default: 'original_payment'
  },
  refundAccount: {
    type: String,
    default: ''
  },
  applicant: {
    type: String,
    default: ''
  },
  applicantType: {
    type: String,
    enum: ['customer', 'cs', 'technician', 'admin'],
    default: 'cs'
  },
  approver: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed', 'cancelled'],
    default: 'pending',
    index: true
  },
  reviewRemark: {
    type: String,
    default: ''
  },
  processedTime: Date,
  remark: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'refunds'
});

refundSchema.index({ status: 1, createdAt: -1 });
refundSchema.index({ refundReason: 1, status: 1 });

refundSchema.pre('save', function(next) {
  if (!this.refundNo) {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
      (date.getMonth() + 1).toString().padStart(2, '0') + 
      date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.refundNo = 'RF' + dateStr + random;
  }
  next();
});

module.exports = mongoose.model('Refund', refundSchema);
