const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    required: true,
    enum: ['空调配件', '冰箱配件', '洗衣机配件', '电视配件', '热水器配件', '燃气灶配件', '油烟机配件', '通用配件', '其他'],
    index: true
  },
  brand: {
    type: String,
    default: ''
  },
  model: {
    type: String,
    default: ''
  },
  specification: {
    type: String,
    default: '',
    description: '规格型号'
  },
  unit: {
    type: String,
    default: '个',
    enum: ['个', '件', '套', '米', '公斤', '箱', '其他']
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
    description: '成本价'
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0,
    description: '销售价'
  },
  markupRate: {
    type: Number,
    default: 30,
    description: '加价比例（百分比）'
  },
  stock: {
    type: Number,
    default: 0,
    description: '库存数量'
  },
  minStock: {
    type: Number,
    default: 0,
    description: '最低库存预警'
  },
  location: {
    type: String,
    default: '',
    description: '存放位置'
  },
  compatibleModels: [{
    type: String
  }],
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
    index: true
  },
  warrantyMonths: {
    type: Number,
    default: 12,
    description: '配件保修月数'
  },
  supplier: {
    type: String,
    default: ''
  },
  remark: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'parts'
});

partSchema.index({ category: 1, status: 1 });
partSchema.index({ name: 'text', brand: 'text', model: 'text', sku: 'text' });

partSchema.pre('save', function(next) {
  if (this.costPrice > 0 && this.salePrice > 0) {
    this.markupRate = Math.round(((this.salePrice - this.costPrice) / this.costPrice) * 100);
  }
  next();
});

module.exports = mongoose.model('Part', partSchema);
