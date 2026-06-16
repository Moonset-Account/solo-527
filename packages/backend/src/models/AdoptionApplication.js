const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true' || !process.env.MONGODB_URI;

if (USE_MEMORY_DB) {
  const { db } = require('../utils/memoryDB');
  module.exports = db.AdoptionApplication;
} else {
  const mongoose = require('mongoose');

  const adoptionApplicationSchema = new mongoose.Schema({
  applicationNo: { type: String, unique: true, required: true },
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  petNo: String,
  petName: String,
  applicantName: { type: String, required: true },
  applicantPhone: { type: String, required: true },
  applicantIdCard: String,
  applicantEmail: String,
  applicantAddress: String,
  housingType: {
    type: String,
    enum: ['apartment', 'house', 'villa', 'other']
  },
  hasPetExperience: { type: Boolean, default: false },
  currentPets: String,
  familyMembers: Number,
  hasChildren: { type: Boolean, default: false },
  workSchedule: String,
  monthlyBudget: Number,
  adoptionReason: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  veterinaryInfo: String,
  missingFields: [String],
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trainerName: String,
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerName: String,
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'draft'
  },
  reviewComments: String,
  rejectionReason: String,
  submittedAt: Date,
  reviewedAt: Date,
  completedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

adoptionApplicationSchema.index({ applicantName: 'text', applicationNo: 'text' });
adoptionApplicationSchema.index({ status: 1, trainerId: 1, createdAt: -1 });
adoptionApplicationSchema.index({ petId: 1, status: 1 });

  module.exports = mongoose.model('AdoptionApplication', adoptionApplicationSchema);
}
