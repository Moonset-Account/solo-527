import mongoose from "mongoose";
import type { Transfer } from "@qinghe/shared";

const transferSchema = new mongoose.Schema<Transfer>(
  {
    transferNo: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ["ALLOCATION", "PURCHASE", "RETURN", "EMERGENCY"],
      required: true,
      index: true,
    },
    sku: { type: String, required: true, index: true },
    skuName: { type: String, required: true },
    batchNo: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    fromLocation: { type: String, required: true },
    toLocation: { type: String, required: true },
    supplier: { type: String },
    plannedDate: { type: Date, required: true },
    expectedDate: { type: Date, required: true, index: true },
    actualDate: { type: Date },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "DELAYED"],
      default: "PENDING",
      index: true,
    },
    delayReason: { type: String },
    delayReasonCategory: { type: String },
    applicant: { type: String, required: true },
    approver: { type: String },
    approvedAt: { type: Date },
    handler: { type: String },
    handlingStartTime: { type: Date },
    handlingEndTime: { type: Date },
    handlingDurationHours: { type: Number },
    remark: { type: String },
    relatedSafetyStockId: { type: String, index: true },
  },
  { timestamps: true }
);

transferSchema.index({ status: 1, expectedDate: 1 });
transferSchema.index({ relatedSafetyStockId: 1, createdAt: -1 });

export const TransferModel = mongoose.model<Transfer>("Transfer", transferSchema);
