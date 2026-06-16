const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  type: {
    type: String,
    enum: ['service', 'hygiene', 'equipment', 'inventory', 'cash', 'other'],
    required: true
  },
  level: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'critical'],
    default: 'moderate'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['reported', 'in_progress', 'resolved', 'closed'],
    default: 'reported'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  resolution: {
    type: String,
    trim: true
  },
  impactOnProfit: {
    type: Number,
    default: 0
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RectificationTask'
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

anomalySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Anomaly', anomalySchema);
