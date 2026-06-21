import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema({
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
  checkInTime: Date,
  checkOutTime: Date,
  checkInLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  checkOutLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  status: {
    type: String,
    enum: ['checked_in', 'checked_out', 'absent', 'leave_early', 'late'],
    default: 'checked_in'
  },
  hours: {
    type: Number,
    default: 0
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remark: String,
  photos: [{
    url: String,
    caption: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

checkInSchema.index({ scheduleId: 1, volunteerId: 1 }, { unique: true });
checkInSchema.index({ activityId: 1 });
checkInSchema.index({ volunteerId: 1, createdAt: -1 });
checkInSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('CheckIn', checkInSchema);
