import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['reporter', 'editor', 'chief_editor', 'admin'],
    default: 'reporter',
  },
  department: String,
  email: String,
  phone: String,
  avatar: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
});

export default mongoose.model('User', userSchema);
