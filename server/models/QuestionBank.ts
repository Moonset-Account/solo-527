import mongoose, { Schema, model, Document } from "mongoose";
import type { QuestionBank, QuestionBankVersion } from "@/shared/types";

export interface IQuestionBank extends Document, Omit<QuestionBank, "id"> {}
export interface IQuestionBankVersion extends Document, Omit<QuestionBankVersion, "id"> {}

const QuestionBankSchema = new Schema<IQuestionBank>(
  { name: String, subject: String },
  { timestamps: true, collection: "question_banks" }
);

const QuestionBankVersionSchema = new Schema<IQuestionBankVersion>(
  {
    bankId: { type: String, required: true, index: true },
    bankName: String,
    version: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    publishedAt: { type: String, required: true },
    classIds: [{ type: String }],
  },
  { timestamps: true, collection: "question_bank_versions" }
);

export const QuestionBankModel = (mongoose.models as any).QuestionBank || model<IQuestionBank>("QuestionBank", QuestionBankSchema);
export const QuestionBankVersionModel =
  models.QuestionBankVersion || model<IQuestionBankVersion>("QuestionBankVersion", QuestionBankVersionSchema);
