import mongoose, { Schema, model, Document } from "mongoose";
import type { ClassSchedule, ScheduleStatus } from "@/shared/types";

export interface IClassSchedule extends Document, Omit<ClassSchedule, "id" | "students"> {}

const ClassScheduleSchema = new Schema<IClassSchedule>(
  {
    classId: { type: String, required: true },
    className: { type: String, required: true },
    teacherId: { type: String, required: true },
    teacherName: { type: String, required: true },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    questionBankVersionId: { type: String, required: true },
    questionBankVersionName: String,
    status: { type: String, enum: ["pending", "completed", "cancelled"] as ScheduleStatus[], default: "pending", index: true },
    studentIds: [{ type: String }],
  },
  { timestamps: true, collection: "class_schedules" }
);

ClassScheduleSchema.index({ classId: 1, date: 1 });
ClassScheduleSchema.index({ date: 1, status: 1 });

export const ClassScheduleModel = (mongoose.models as any).ClassSchedule || model<IClassSchedule>("ClassSchedule", ClassScheduleSchema);
