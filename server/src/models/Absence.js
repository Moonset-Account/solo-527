import mongoose from 'mongoose';

const absenceSchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    required: true
  },
  checkInId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CheckIn'
  },
  type: {
    type: String,
    enum: ['no_show', 'late', 'leave_early', 'cancelled_late'],
    default: 'no_show'
  },
  reason: {
    type: String,
    required: true
  },
  impactScope: {
    type: String,
    required: true
  },
  impactLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  responsiblePerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responsiblePersonName: String,
  handlePlan: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['reported', 'handling', 'resolved', 'closed'],
    default: 'reported'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  replacementVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer'
  },
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
  remarks: String,
  closeNote: String,
  closedAt: Date,
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sourceOrderId: String,
  sourceOrderType: String
}, {
  timestamps: true
});

absenceSchema.index({ status: 1, createdAt: -1 });
absenceSchema.index({ scheduleId: 1 });
absenceSchema.index({ volunteerId: 1 });
absenceSchema.index({ impactLevel: 1, status: 1 });
absenceSchema.index({ responsiblePerson: 1, status: 1 });

export default mongoose.model('Absence', absenceSchema);
