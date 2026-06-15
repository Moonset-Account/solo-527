import { Schema, model } from 'mongoose';
import type { IConfig } from '../common/types/index.js';

export const ConfigSchema = new Schema<IConfig>(
  {
    type: {
      type: String,
      enum: ['switch', 'review_template', 'system'],
      required: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ConfigModel = model<IConfig>('Config', ConfigSchema);
