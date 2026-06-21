import mongoose from 'mongoose';

const scheduleItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  articleTitle: String,
  platform: {
    type: String,
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  scheduledTimeSlot: String,
  status: {
    type: String,
    enum: ['scheduled', 'published', 'delayed', 'cancelled'],
    default: 'scheduled',
  },
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedName: String,
  notes: String,
  order: {
    type: Number,
    default: 0,
  },
});

const scheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
  items: [scheduleItemSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  version: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

scheduleSchema.index({ date: 1, platform: 1 }, { unique: true });
scheduleSchema.index({ 'items.status': 1 });

export default mongoose.model('Schedule', scheduleSchema);
