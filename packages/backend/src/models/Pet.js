const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true' || !process.env.MONGODB_URI;

if (USE_MEMORY_DB) {
  const { db } = require('../utils/memoryDB');
  module.exports = db.Pet;
} else {
  const mongoose = require('mongoose');

  const petSchema = new mongoose.Schema({
  petNo: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  species: { type: String, enum: ['dog', 'cat', 'other'], required: true },
  breed: String,
  gender: { type: String, enum: ['male', 'female', 'unknown'] },
  birthday: Date,
  weight: Number,
  color: String,
  chipNo: String,
  vaccineStatus: {
    rabies: { type: Boolean, default: false },
    distemper: { type: Boolean, default: false },
    parvovirus: { type: Boolean, default: false },
    catPlague: { type: Boolean, default: false }
  },
  sterilized: { type: Boolean, default: false },
  healthStatus: { type: String, enum: ['healthy', 'sick', 'recovering'], default: 'healthy' },
  temperament: String,
  dietaryNotes: String,
  medicalNotes: String,
  photo: String,
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['pending', 'fostering', 'adopted', 'returned', 'deceased'], 
    default: 'pending' 
  },
  fosterStartTime: Date,
  fosterEndTime: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

petSchema.index({ name: 'text', breed: 'text', petNo: 'text' });
petSchema.index({ status: 1, trainerId: 1 });

  module.exports = mongoose.model('Pet', petSchema);
}
