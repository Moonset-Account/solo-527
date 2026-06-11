import mongoose, { Schema, model, Document } from "mongoose";
import type { Student } from "@/shared/types";

export interface IStudent extends Document, Omit<Student, "id"> {}

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true, index: true },
    parentPhone: { type: String, required: true },
    remainingHours: { type: Number, required: true, default: 0, min: 0, index: true },
    classId: { type: String, required: true, index: true },
    alertThreshold: { type: Number, default: 3 },
  },
  { timestamps: true, collection: "students" }
);

export const StudentModel = (mongoose.models as any).Student || model<IStudent>("Student", StudentSchema);
