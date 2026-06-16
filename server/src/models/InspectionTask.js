const mongoose = require('mongoose');

const inspectionTaskSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special', 'random'],
    default: 'daily'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'],
    default: 'scheduled'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  checklist: [{
    item: String,
    category: String,
    status: {
      type: String,
      enum: ['pass', 'fail', 'n/a'],
      default: 'n/a'
    },
    note: String,
    image: String
  }],
  score: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 100
  },
  notes: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  impactOnProfit: {
    type: Number,
    default: 0
  },
  profitNote: {
    type: String,
    trim: true
  },
  reminderDays: {
    type: Number,
    default: 1
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

inspectionTaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('InspectionTask', inspectionTaskSchema);
