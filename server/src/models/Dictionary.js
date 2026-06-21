import mongoose from 'mongoose';

const dictionaryItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  sort: {
    type: Number,
    default: 0,
  },
  color: String,
  description: String,
  enabled: {
    type: Boolean,
    default: true,
  },
  parentId: String,
  extra: mongoose.Schema.Types.Mixed,
});

const dictionarySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  type: {
    type: String,
    enum: ['select', 'multi_select', 'radio', 'checkbox', 'tree', 'tag'],
    default: 'select',
  },
  items: [dictionaryItemSchema],
  system: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
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

dictionarySchema.index({ code: 1 }, { unique: true });
dictionarySchema.index({ enabled: 1 });

export default mongoose.model('Dictionary', dictionarySchema);
