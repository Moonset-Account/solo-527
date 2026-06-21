import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'low_volunteers',
      'absence_high',
      'no_show',
      'schedule_conflict',
      'feedback_urgent',
      'donation_pending',
      'activity_starting',
      'custom'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'danger', 'critical'],
    default: 'warning'
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active'
  },
  relatedId: String,
  relatedType: String,
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
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNote: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

alertSchema.index({ status: 1, severity: 1, createdAt: -1 });
alertSchema.index({ type: 1, status: 1 });
alertSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model('Alert', alertSchema);
