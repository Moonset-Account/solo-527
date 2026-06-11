import mongoose, { Schema, model, Document } from "mongoose";
import type { User, UserRole } from "@/shared/types";

export interface IUser extends Document, Omit<User, "id" | "passwordHash"> {
  passwordHash: string;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["teacher", "operator", "admin"] as UserRole[], required: true, default: "teacher" },
    avatar: String,
    passwordHash: { type: String, required: true },
  },
  { timestamps: true, collection: "users" }
);

export const UserModel = (mongoose.models as any).User || model<IUser>("User", UserSchema);
