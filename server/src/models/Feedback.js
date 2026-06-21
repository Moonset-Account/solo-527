import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer'
  },
  type: {
    type: String,
    enum: ['suggestion', 'complaint', 'praise', 'other'],
    default: 'suggestion'
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  attachments: [{
    name: String,
    url: String,
    size: Number,
    uploadedAt: Date
  }],
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewComment: String,
  reviewedAt: Date,
  handler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  handlePlan: String,
  handledAt: Date,
  closeNote: String,
  closedAt: Date,
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sourceOrderId: String,
  sourceOrderType: String
}, {
  timestamps: true
});

feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ activityId: 1 });
feedbackSchema.index({ volunteerId: 1 });
feedbackSchema.index({ priority: 1, status: 1 });

export default mongoose.model('Feedback', feedbackSchema);
