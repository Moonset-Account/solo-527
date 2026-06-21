import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    required: true
  },
  donorPhone: String,
  donorType: {
    type: String,
    enum: ['individual', 'organization', 'enterprise'],
    default: 'individual'
  },
  type: {
    type: String,
    enum: ['money', 'material', 'service'],
    required: true
  },
  amount: Number,
  currency: {
    type: String,
    default: 'CNY'
  },
  items: [{
    name: String,
    quantity: Number,
    unit: String,
    value: Number,
    remark: String
  }],
  description: String,
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'received', 'rejected'],
    default: 'pending'
  },
  receiptNumber: String,
  receiptIssued: {
    type: Boolean,
    default: false
  },
  receiptDate: Date,
  attachments: [{
    name: String,
    url: String,
    size: Number,
    uploadedAt: Date
  }],
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receivedAt: Date,
  remark: String,
  sourceOrderId: String,
  sourceOrderType: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  publicNote: String
}, {
  timestamps: true
});

donationSchema.index({ status: 1, createdAt: -1 });
donationSchema.index({ type: 1 });
donationSchema.index({ donorPhone: 1 });
donationSchema.index({ activityId: 1 });

export default mongoose.model('Donation', donationSchema);
