const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ruleType: {
    type: String,
    required: true,
    enum: ['time_slot', 'difficulty', 'distance', 'urgent', 'quantity', 'custom'],
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  priceType: {
    type: String,
    enum: ['fixed', 'percentage', 'tiered'],
    default: 'fixed'
  },
  value: {
    type: Number,
    default: 0,
    description: '固定金额或百分比'
  },
  minValue: {
    type: Number,
    default: 0
  },
  maxValue: {
    type: Number
  },
  tieredRules: [{
    min: Number,
    max: Number,
    value: Number,
    priceType: { type: String, enum: ['fixed', 'percentage'] }
  }],
  applicableCategories: [{
    type: String,
    enum: ['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机', '其他']
  }],
  applicableServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  timeSlots: [{
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: String,
    endTime: String,
    value: Number,
    priceType: { type: String, enum: ['fixed', 'percentage'] }
  }],
  priority: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  },
  effectiveDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'pricing_rules'
});

pricingRuleSchema.index({ ruleType: 1, status: 1 });
pricingRuleSchema.index({ priority: -1 });

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
