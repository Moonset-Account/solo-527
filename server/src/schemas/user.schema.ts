import { Schema, model } from 'mongoose';
import type { IUser } from '../common/types/index.js';

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['pm', 'admin'],
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = model<IUser>('User', UserSchema);
