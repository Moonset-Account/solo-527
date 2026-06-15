import { Schema, model } from 'mongoose';
import type { IDepartment } from '../common/types/index.js';

export const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    head: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const DepartmentModel = model<IDepartment>('Department', DepartmentSchema);
