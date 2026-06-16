const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
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
  sku: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['tea_leaf', 'milk', 'sugar', 'topping', 'fruit', 'packaging', 'other'],
    default: 'other'
  },
  unit: {
    type: String,
    default: '份'
  },
  quantity: {
    type: Number,
    default: 0
  },
  unitPrice: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  minStock: {
    type: Number,
    default: 10
  },
  maxStock: {
    type: Number,
    default: 100
  },
  expiryDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['normal', 'low', 'out_of_stock', 'expired'],
    default: 'normal'
  },
  lastRestockedAt: {
    type: Date
  },
  lastCheckedAt: {
    type: Date
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

inventorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.totalValue = this.quantity * this.unitPrice;
  
  if (this.quantity <= 0) {
    this.status = 'out_of_stock';
  } else if (this.quantity <= this.minStock) {
    this.status = 'low';
  } else if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = 'expired';
  } else {
    this.status = 'normal';
  }
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
