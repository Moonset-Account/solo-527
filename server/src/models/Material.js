import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  type: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', 'other'],
    default: 'image',
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: String,
  fileSize: Number,
  mimeType: String,
  thumbnail: String,
  tags: [{
    type: String,
    trim: true,
  }],
  category: String,
  source: String,
  author: String,
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorization: {
    status: {
      type: String,
      enum: ['authorized', 'pending', 'unauthorized', 'unknown'],
      default: 'unknown',
    },
    type: String,
    expireDate: Date,
    scope: String,
    note: String,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  usedInArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft',
  },
  metadata: mongoose.Schema.Types.Mixed,
  customFields: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

materialSchema.index({ tags: 1 });
materialSchema.index({ status: 1 });
materialSchema.index({ uploader: 1 });
materialSchema.index({ 'authorization.status': 1 });

export default mongoose.model('Material', materialSchema);
