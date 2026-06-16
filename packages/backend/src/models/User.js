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
