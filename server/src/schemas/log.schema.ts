import { Schema, model } from 'mongoose';
import type { ILog } from '../common/types/index.js';

export const LogSchema = new Schema<ILog>(
  {
    type: {
      type: String,
      enum: ['claim', 'progress', 'review', 'config_change', 'overdue_mark', 'user_action'],
      required: true,
      index: true,
    },
    operator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    detail: {
      field: {
        type: String,
        required: true,
      },
      oldValue: {
        type: Schema.Types.Mixed,
      },
      newValue: {
        type: Schema.Types.Mixed,
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

LogSchema.index({ createdAt: -1 });

export const LogModel = model<ILog>('Log', LogSchema);
