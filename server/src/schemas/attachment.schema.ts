import { Schema, model } from 'mongoose';
import type { IAttachment } from '../common/types/index.js';

export const AttachmentSchema = new Schema<IAttachment>(
  {
    filename: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    refId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    refType: {
      type: String,
      enum: ['item', 'config'],
      required: true,
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

AttachmentSchema.index({ refId: 1, refType: 1 });

export const AttachmentModel = model<IAttachment>('Attachment', AttachmentSchema);
