const mongoose = require('mongoose');

const rectificationTaskSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  taskNo: {
    type: String,
    unique: true
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
  type: {
    type: String,
    enum: ['service', 'hygiene', 'equipment', 'inventory', 'cash', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'submitted', 'rejected', 'approved', 'closed'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date
  },
  relatedAnomaly: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Anomaly'
  },
  images: [{
    type: String
  }],
  submissionNote: {
    type: String,
    trim: true
  },
  submissionImages: [{
    type: String
  }],
  submittedAt: {
    type: Date
  },
  reviewNote: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  impactOnProfit: {
    type: Number,
    default: 0
  },
  profitNote: {
    type: String,
    trim: true
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

rectificationTaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RectificationTask', rectificationTaskSchema);
