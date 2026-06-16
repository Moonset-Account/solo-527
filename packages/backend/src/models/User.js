const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true' || !process.env.MONGODB_URI;

if (USE_MEMORY_DB) {
  const { db } = require('../utils/memoryDB');
  module.exports = db.User;
} else {
  const mongoose = require('mongoose');

  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['admin', 'trainer', 'reviewer'], 
      default: 'trainer' 
    },
    phone: String,
    email: String,
    avatar: String,
    status: { type: String, enum: ['active', 'disabled'], default: 'active' }
  }, {
    timestamps: true
  });

  module.exports = mongoose.model('User', userSchema);
}
