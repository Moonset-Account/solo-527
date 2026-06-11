import mongoose, { Schema, model, Document } from "mongoose";
import type { ConsumptionRecord } from "@/shared/types";

export interface IConsumptionRecord extends Document, Omit<ConsumptionRecord, "id" | "auditLogs" | "feedback"> {}

const ConsumptionRecordSchema = new Schema<IConsumptionRecord>(
  {
    scheduleId: { type: String, required: true, index: true },
    classId: String,
    className: String,
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    hours: { type: Number, required: true, min: 0 },
    operatorId: { type: String, required: true },
    operatorName: { type: String, required: true },
    questionBankVersionId: { type: String, required: true },
    questionBankVersionName: { type: String, required: true },
    remark: String,
    isInsufficient: { type: Boolean, default: false, index: true },
    insufficientHours: { type: Number, default: 0 },
    createdAt: { type: String, required: true, index: true },
  },
  { collection: "consumption_records" }
);

ConsumptionRecordSchema.index({ studentId: 1, createdAt: -1 });

export const ConsumptionRecordModel =
  models.ConsumptionRecord || model<IConsumptionRecord>("ConsumptionRecord", ConsumptionRecordSchema);
