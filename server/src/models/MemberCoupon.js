const mongoose = require('mongoose');

const memberCouponSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['discount', 'cash', 'gift', 'points'],
    default: 'discount'
  },
  value: {
    type: Number,
    default: 0
  },
  minSpend: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  },
  usedCount: {
    type: Number,
    default: 0
  },
  remainingCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date
  },
  validTo: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'expired', 'used_up', 'disabled'],
    default: 'draft'
  },
  applicableProducts: [{
    type: String
  }],
  description: {
    type: String,
    trim: true
  },
  distributionMethod: {
    type: String,
    enum: ['manual', 'auto', 'event'],
    default: 'manual'
  },
  reminderDays: {
    type: Number,
    default: 3
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

memberCouponSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.remainingCount = this.totalCount - this.usedCount;
  
  const now = new Date();
  if (this.status !== 'draft' && this.status !== 'disabled') {
    if (this.remainingCount <= 0) {
      this.status = 'used_up';
    } else if (this.validTo && now > this.validTo) {
      this.status = 'expired';
    } else if (this.validFrom && now >= this.validFrom) {
      this.status = 'active';
    }
  }
  next();
});

module.exports = mongoose.model('MemberCoupon', memberCouponSchema);
