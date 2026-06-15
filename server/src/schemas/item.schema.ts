import { Schema, model } from 'mongoose';
import type { IItem } from '../common/types/index.js';

const ItemSchema = new Schema<IItem>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue', 'archived'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deadline: {
      type: Date,
      required: true,
      index: true,
    },
    claimedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

ItemSchema.index({ createdAt: -1 });

export const ItemModel = model<IItem>('Item', ItemSchema);
