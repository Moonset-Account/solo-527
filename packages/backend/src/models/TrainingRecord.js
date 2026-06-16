const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true' || !process.env.MONGODB_URI;

if (USE_MEMORY_DB) {
  const { db } = require('../utils/memoryDB');
  module.exports = db.TrainingRecord;
} else {
  const mongoose = require('mongoose');

  const trainingRecordSchema = new mongoose.Schema({
  recordNo: { type: String, unique: true, required: true },
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  petNo: String,
  petName: String,
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainerName: String,
  trainingDate: { type: Date, required: true },
  trainingType: {
    type: String,
    enum: ['obedience', 'socialization', 'behavior_correction', 'agility', 'basic_commands', 'other'],
    required: true
  },
  trainingContent: String,
  duration: Number,
  performance: {
    type: String,
    enum: ['excellent', 'good', 'average', 'poor']
  },
  notes: String,
  beforeBehavior: String,
  afterBehavior: String,
  nextPlan: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

trainingRecordSchema.index({ petId: 1, trainingDate: -1 });
trainingRecordSchema.index({ trainerId: 1, trainingDate: -1 });

  module.exports = mongoose.model('TrainingRecord', trainingRecordSchema);
}
