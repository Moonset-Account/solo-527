import mongoose from 'mongoose';

const exceptionSchema = new mongoose.Schema({
  exceptionNo: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['authorization_risk', 'copyright_risk', 'content_risk', 'schedule_conflict', 'other'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  relatedType: {
    type: String,
    enum: ['material', 'article', 'schedule'],
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel',
  },
  relatedModel: String,
  relatedTitle: String,
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
  },
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  raisedByName: String,
  raisedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'resolved', 'closed'],
    default: 'pending',
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assigneeName: String,
  handlingNotes: [{
    id: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    note: String,
    status: String,
    createdAt: { type: Date, default: Date.now },
  }],
  resolution: String,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedByName: String,
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  closedByName: String,
  closedAt: Date,
  closingRemark: String,
  customFields: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

exceptionSchema.index({ status: 1 });
exceptionSchema.index({ type: 1 });
exceptionSchema.index({ severity: 1 });
exceptionSchema.index({ raisedBy: 1 });
exceptionSchema.index({ materialId: 1 });
exceptionSchema.index({ articleId: 1 });

export default mongoose.model('Exception', exceptionSchema);
