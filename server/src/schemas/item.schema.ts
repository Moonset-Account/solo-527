import { Schema, model } from 'mongoose';
import type { IItem } from '../common/types/index.js';

const itemSchema = new Schema<IItem>(
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
      required: false,
      default: null,
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

itemSchema.index({ createdAt: -1 });

export const ItemSchema = itemSchema;
export const ItemModel = model<IItem>('Item', itemSchema);
