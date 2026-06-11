import mongoose, { Schema, model, Document } from "mongoose";
import type { Feedback } from "@/shared/types";

export interface IFeedback extends Document, Omit<Feedback, "id"> {}

const FeedbackSchema = new Schema<IFeedback>(
  {
    studentId: { type: String, required: true, index: true },
    studentName: String,
    consumptionId: { type: String, index: true },
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: String, required: true },
    writerRole: { type: String, enum: ["parent", "teacher"], required: true },
  },
  { collection: "feedbacks" }
);

FeedbackSchema.index({ studentId: 1, createdAt: -1 });

export const FeedbackModel = (mongoose.models as any).Feedback || model<IFeedback>("Feedback", FeedbackSchema);
