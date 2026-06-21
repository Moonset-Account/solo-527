import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  shiftName: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: String,
  maxVolunteers: {
    type: Number,
    default: 10
  },
  minVolunteers: {
    type: Number,
    default: 2
  },
  requiredSkills: [String],
  description: String,
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  volunteers: [{
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer'
    },
    status: {
      type: String,
      enum: ['signed_up', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'absent'],
      default: 'signed_up'
    },
    signedUpAt: Date,
    confirmedAt: Date,
    checkedInAt: Date,
    checkedOutAt: Date,
    hours: Number,
    remark: String
  }],
  attachments: [{
    name: String,
    url: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  }],
  remarks: String
}, {
  timestamps: true
});

scheduleSchema.index({ activityId: 1, date: 1 });
scheduleSchema.index({ 'volunteers.volunteerId': 1 });
scheduleSchema.index({ status: 1, date: 1 });

export default mongoose.model('Schedule', scheduleSchema);
