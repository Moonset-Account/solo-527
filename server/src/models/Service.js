const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机', '其他'],
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  serviceFee: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number,
    default: 60,
    description: '预计服务时长（分钟）'
  },
  warrantyDays: {
    type: Number,
    default: 90,
    description: '保修天数'
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true
  },
  icon: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'services'
});

serviceSchema.index({ category: 1, status: 1 });
serviceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
