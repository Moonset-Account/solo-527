const mongoose = require('mongoose');

const safetyReminderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ['health', 'safety', 'feeding', 'behavior', 'legal', 'other'],
    required: true
  },
  level: {
    type: String,
    enum: ['info', 'warning', 'danger'],
    default: 'info'
  },
  targetAudience: {
    type: String,
    enum: ['foster_family', 'adopter', 'trainer', 'all'],
    default: 'all'
  },
  isActive: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

safetyReminderSchema.index({ category: 1, isActive: 1 });
safetyReminderSchema.index({ isPinned: 1, sortOrder: 1 });

module.exports = mongoose.model('SafetyReminder', safetyReminderSchema);
