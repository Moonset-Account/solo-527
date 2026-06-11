import mongoose, { Schema, model, Document } from "mongoose";
import type { ClassInfo } from "@/shared/types";

export interface IClassInfo extends Document, Omit<ClassInfo, "id"> {}

const ClassInfoSchema = new Schema<IClassInfo>(
  {
    name: { type: String, required: true },
    level: { type: String, required: true },
    teacherIds: [{ type: String }],
  },
  { timestamps: true, collection: "classes" }
);

export const ClassInfoModel = (mongoose.models as any).ClassInfo || model<IClassInfo>("ClassInfo", ClassInfoSchema);
