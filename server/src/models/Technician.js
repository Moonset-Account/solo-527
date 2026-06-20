const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  idCard: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  skillCategories: [{
    type: String,
    enum: ['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机', '其他']
  }],
  level: {
    type: String,
    enum: ['初级', '中级', '高级', '专家'],
    default: '中级'
  },
  baseSalary: {
    type: Number,
    default: 0
  },
  commissionRate: {
    type: Number,
    default: 15,
    description: '提成比例（百分比）'
  },
  serviceFee: {
    type: Number,
    default: 0,
    description: '师傅上门服务费'
  },
  hourlyRate: {
    type: Number,
    default: 0,
    description: '时薪（用于复杂报价）'
  },
  store: {
    type: String,
    default: '',
    description: '所属门店'
  },
  status: {
    type: String,
    enum: ['on_duty', 'off_duty', 'busy', 'leave'],
    default: 'off_duty',
    index: true
  },
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  completedOrders: {
    type: Number,
    default: 0
  },
  workArea: {
    type: String,
    default: ''
  },
  joinDate: {
    type: Date
  },
  remark: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'technicians'
});

technicianSchema.index({ store: 1, status: 1 });
technicianSchema.index({ skillCategories: 1 });

module.exports = mongoose.model('Technician', technicianSchema);
