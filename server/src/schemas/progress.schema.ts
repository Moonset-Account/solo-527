import { Schema, model } from 'mongoose';
import type { IProgress } from '../common/types/index.js';

const progressSchema = new Schema<IProgress>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    operator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const ProgressSchema = progressSchema;
export const ProgressModel = model<IProgress>('Progress', progressSchema);
