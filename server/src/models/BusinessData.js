const mongoose = require('mongoose');

const businessDataSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  totalSales: {
    type: Number,
    default: 0
  },
  orderCount: {
    type: Number,
    default: 0
  },
  avgOrderValue: {
    type: Number,
    default: 0
  },
  memberSales: {
    type: Number,
    default: 0
  },
  takeoutSales: {
    type: Number,
    default: 0
  },
  dineInSales: {
    type: Number,
    default: 0
  },
  costOfGoods: {
    type: Number,
    default: 0
  },
  laborCost: {
    type: Number,
    default: 0
  },
  rentCost: {
    type: Number,
    default: 0
  },
  utilityCost: {
    type: Number,
    default: 0
  },
  otherCost: {
    type: Number,
    default: 0
  },
  grossProfit: {
    type: Number,
    default: 0
  },
  netProfit: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  weather: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
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

businessDataSchema.index({ store: 1, date: 1 }, { unique: true });

businessDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.grossProfit = this.totalSales - this.costOfGoods;
  this.netProfit = this.totalSales - this.costOfGoods - this.laborCost - this.rentCost - this.utilityCost - this.otherCost;
  this.profitMargin = this.totalSales > 0 ? (this.netProfit / this.totalSales) * 100 : 0;
  if (this.totalSales > 0 && this.orderCount > 0) {
    this.avgOrderValue = this.totalSales / this.orderCount;
  }
  next();
});

module.exports = mongoose.model('BusinessData', businessDataSchema);
