import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  content: String,
  type: {
    type: String,
    enum: ['comment', 'suggestion', 'question', 'correction'],
    default: 'comment',
  },
  createdAt: { type: Date, default: Date.now },
});

const reviewOpinionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerName: String,
  content: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_revision'],
    default: 'pending',
  },
  level: {
    type: String,
    enum: ['first', 'second', 'final'],
  },
  createdAt: { type: Date, default: Date.now },
});

const coverVersionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  version: String,
  title: String,
  imageUrl: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: String,
  isCurrent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subtitle: String,
  summary: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  authorName: String,
  category: String,
  tags: [{
    type: String,
    trim: true,
  }],
  materials: [{
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    usageNote: String,
    addedAt: { type: Date, default: Date.now },
  }],
  coverVersions: [coverVersionSchema],
  currentCoverId: String,
  feedbacks: [feedbackSchema],
  reviewOpinions: [reviewOpinionSchema],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewing', 'revised', 'approved', 'published', 'rejected'],
    default: 'draft',
  },
  reviewLevel: {
    type: Number,
    default: 0,
  },
  wordCount: {
    type: Number,
    default: 0,
  },
  platforms: [{
    type: String,
  }],
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal',
  },
  scheduledTime: Date,
  publishTime: Date,
  views: {
    type: Number,
    default: 0,
  },
  customFields: mongoose.Schema.Types.Mixed,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

articleSchema.index({ status: 1 });
articleSchema.index({ author: 1 });
articleSchema.index({ scheduledTime: 1 });
articleSchema.index({ tags: 1 });

export default mongoose.model('Article', articleSchema);
