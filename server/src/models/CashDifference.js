const mongoose = require('mongoose');

const cashDifferenceSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'all_day'],
    default: 'all_day'
  },
  expectedCash: {
    type: Number,
    default: 0
  },
  actualCash: {
    type: Number,
    default: 0
  },
  difference: {
    type: Number,
    default: 0
  },
  differenceType: {
    type: String,
    enum: ['over', 'short', 'balanced'],
    default: 'balanced'
  },
  reason: {
    type: String,
    enum: ['change_error', 'register_error', 'theft', 'discount', 'refund', 'other'],
    default: 'other'
  },
  note: {
    type: String,
    trim: true
  },
  handlingResult: {
    type: String,
    enum: ['pending', 'adjusted', 'investigated', 'written_off', 'recovered'],
    default: 'pending'
  },
  handlingNote: {
    type: String,
    trim: true
  },
  impactOnProfit: {
    type: Number,
    default: 0
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  handledAt: {
    type: Date
  },
  recordedBy: {
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

cashDifferenceSchema.index({ store: 1, date: 1, shift: 1 }, { unique: true });

cashDifferenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.difference = this.actualCash - this.expectedCash;
  
  if (this.difference > 0) {
    this.differenceType = 'over';
  } else if (this.difference < 0) {
    this.differenceType = 'short';
  } else {
    this.differenceType = 'balanced';
  }
  next();
});

module.exports = mongoose.model('CashDifference', cashDifferenceSchema);
