import mongoose from 'mongoose';

const volunteerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  idCard: String,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  age: Number,
  avatar: String,
  team: String,
  skills: [String],
  totalHours: {
    type: Number,
    default: 0
  },
  totalActivities: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  remark: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('Volunteer', volunteerSchema);
