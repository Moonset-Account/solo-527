const mongoose = require('mongoose');

const satisfactionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  orderNo: {
    type: String,
    index: true
  },
  customerName: String,
  customerPhone: String,
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  serviceQuality: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  technicianAttitude: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  priceSatisfaction: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  responseSpeed: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  positiveComments: {
    type: String,
    default: ''
  },
  negativeComments: {
    type: String,
    default: ''
  },
  suggestions: {
    type: String,
    default: ''
  },
  willRecommend: {
    type: Boolean,
    default: true
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
    index: true
  },
  technicianName: String,
  store: {
    type: String,
    default: '',
    index: true
  },
  customerService: {
    type: String,
    default: '',
    index: true
  },
  visitStatus: {
    type: String,
    enum: ['not_visited', 'pending', 'visited', 'no_answer', 'customer_busy'],
    default: 'not_visited',
    index: true
  },
  visitor: {
    type: String,
    default: ''
  },
  visitTime: Date,
  visitRemark: {
    type: String,
    default: ''
  },
  badReviewReason: {
    type: String,
    enum: ['price_issue', 'service_quality', 'technician_attitude', 'timing_issue', 'communication_issue', 'other'],
    index: true
  },
  badReviewDetail: {
    type: String,
    default: ''
  },
  followUpStatus: {
    type: String,
    enum: ['not_followed', 'followed', 'resolved', 'unresolved', 'escalated'],
    default: 'not_followed',
    index: true
  },
  followUpRemark: {
    type: String,
    default: ''
  },
  followUpTime: Date,
  followUpBy: String,
  surveySource: {
    type: String,
    enum: ['wechat', 'phone', 'app', 'onsite', 'other'],
    default: 'wechat'
  }
}, {
  timestamps: true,
  collection: 'satisfaction_surveys'
});

satisfactionSchema.index({ store: 1, overallRating: 1 });
satisfactionSchema.index({ customerService: 1, createdAt: -1 });
satisfactionSchema.index({ overallRating: 1, badReviewReason: 1 });
satisfactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Satisfaction', satisfactionSchema);
