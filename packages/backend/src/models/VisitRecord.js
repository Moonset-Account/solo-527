const mongoose = require('mongoose');

const visitRecordSchema = new mongoose.Schema({
  recordNo: { type: String, unique: true, required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdoptionApplication', required: true },
  applicationNo: String,
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
  petName: String,
  applicantName: String,
  visitType: {
    type: String,
    enum: ['first_week', 'first_month', 'quarterly', 'random', 'complaint'],
    required: true
  },
  visitDate: { type: Date, required: true },
  visitMethod: {
    type: String,
    enum: ['home_visit', 'video_call', 'phone_call', 'on_site'],
    required: true
  },
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visitorName: String,
  petCondition: {
    health: { type: String, enum: ['excellent', 'good', 'average', 'poor'] },
    mood: { type: String, enum: ['excellent', 'good', 'average', 'poor'] },
    weight: Number,
    diet: String,
    exercise: String
  },
  livingEnvironment: String,
  problems: String,
  suggestions: String,
  photos: [String],
  overallStatus: {
    type: String,
    enum: ['excellent', 'good', 'average', 'poor', 'needs_attention']
  },
  followUpRequired: { type: Boolean, default: false },
  followUpDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

visitRecordSchema.index({ applicationId: 1, visitDate: -1 });
visitRecordSchema.index({ visitorId: 1, visitDate: -1 });

module.exports = mongoose.model('VisitRecord', visitRecordSchema);
