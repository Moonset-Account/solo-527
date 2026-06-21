import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['community', 'education', 'environment', 'medical', 'elderly', 'other'],
    default: 'community'
  },
  location: String,
  address: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  maxVolunteers: {
    type: Number,
    default: 20
  },
  minVolunteers: {
    type: Number,
    default: 5
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  organizer: String,
  contactPerson: String,
  contactPhone: String,
  coverImage: String,
  photos: [{
    url: String,
    caption: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
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
  remarks: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

activitySchema.index({ startDate: 1, status: 1 });
activitySchema.index({ type: 1 });

export default mongoose.model('Activity', activitySchema);
