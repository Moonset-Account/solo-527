const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  type: {
    type: String,
    enum: ['inventory', 'rectification', 'member_coupon', 'profit', 'cash_difference', 'business'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedType: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'processed', 'dismissed'],
    default: 'pending'
  },
  ruleName: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  readAt: {
    type: Date
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processNote: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reminderSchema.index({ store: 1, status: 1, createdAt: -1 });
reminderSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Reminder', reminderSchema);
