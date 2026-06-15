import mongoose from "mongoose";
import type { ReceiptDiff } from "@qinghe/shared";

const receiptDiffSchema = new mongoose.Schema<ReceiptDiff>(
  {
    diffNo: { type: String, required: true, unique: true, index: true },
    inboundOrderNo: { type: String, required: true, index: true },
    batchNo: { type: String, required: true, index: true },
    sku: { type: String, required: true, index: true },
    skuName: { type: String, required: true },
    diffType: {
      type: String,
      enum: ["QUANTITY", "QUALITY", "DOCUMENT", "OTHER"],
      required: true,
      index: true,
    },
    expectedQuantity: { type: Number, required: true },
    actualQuantity: { type: Number, required: true },
    diffQuantity: { type: Number, required: true },
    unit: { type: String, default: "件" },
    description: { type: String, required: true },
    rootCause: { type: String },
    correctiveAction: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    reporter: { type: String, required: true },
    handler: { type: String },
    handledAt: { type: Date },
    approver: { type: String },
    approvedAt: { type: Date },
    relatedSafetyStockId: { type: String, index: true },
    impactOnSafetyStock: { type: Boolean, default: false },
    remark: { type: String },
  },
  { timestamps: true }
);

receiptDiffSchema.index({ status: 1, createdAt: -1 });

export const ReceiptDiffModel = mongoose.model<ReceiptDiff>(
  "ReceiptDiff",
  receiptDiffSchema
);
