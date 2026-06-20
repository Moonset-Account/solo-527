const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    required: true,
    enum: ['super_admin', 'store_manager', 'customer_service', 'technician', 'accountant'],
    default: 'customer_service',
    index: true
  },
  store: {
    type: String,
    default: '',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'locked'],
    default: 'active',
    index: true
  },
  lastLoginAt: Date,
  lastLoginIp: String,
  permissions: [{
    type: String
  }]
}, {
  timestamps: true,
  collection: 'users'
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);
