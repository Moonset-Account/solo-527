import mongoose, { Schema, model, Document } from "mongoose";
import type { Notice, NoticeReceipt, NoticeTargetType } from "@/shared/types";

export interface INotice extends Document, Omit<Notice, "id"> {}
export interface INoticeReceipt extends Document, Omit<NoticeReceipt, "id"> {}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    templateId: String,
    senderId: { type: String, required: true },
    senderName: String,
    targetType: { type: String, required: true } as unknown as NoticeTargetType,
    targetIds: [{ type: String }],
    publishedAt: { type: String, required: true, index: true },
    receiptDeadline: { type: String, required: true },
  },
  { timestamps: true, collection: "notices" }
);

const NoticeReceiptSchema = new Schema<INoticeReceipt>(
  {
    noticeId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    studentName: String,
    parentName: String,
    parentPhone: String,
    isRead: { type: Boolean, default: false, index: true },
    isConfirmed: { type: Boolean, default: false, index: true },
    feedback: String,
    readAt: String,
    confirmedAt: String,
  },
  { timestamps: true, collection: "notice_receipts" }
);

NoticeReceiptSchema.index({ noticeId: 1, studentId: 1 }, { unique: true });

export const NoticeModel = (mongoose.models as any).Notice || model<INotice>("Notice", NoticeSchema);
export const NoticeReceiptModel = (mongoose.models as any).NoticeReceipt || model<INoticeReceipt>("NoticeReceipt", NoticeReceiptSchema);
