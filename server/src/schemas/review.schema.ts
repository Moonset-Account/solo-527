import { Schema, model } from 'mongoose';
import type { IReview } from '../common/types/index.js';

const reviewSchema = new Schema<IReview>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      unique: true,
    },
    conclusion: {
      type: String,
      enum: ['completed', 'partial', 'incomplete', 'escalated'],
      required: true,
    },
    remark: {
      type: String,
      required: true,
    },
    operator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ReviewSchema = reviewSchema;
export const ReviewModel = model<IReview>('Review', reviewSchema);
