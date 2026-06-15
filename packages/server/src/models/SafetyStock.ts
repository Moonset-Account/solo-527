import mongoose from "mongoose";
import type { SafetyStock } from "@qinghe/shared";

const safetyStockSchema = new mongoose.Schema<SafetyStock>(
  {
    sku: { type: String, required: true, unique: true, index: true },
    skuName: { type: String, required: true },
    category: { type: String, index: true },
    minQuantity: { type: Number, required: true },
    maxQuantity: { type: Number },
    reorderPoint: { type: Number, required: true },
    reorderQuantity: { type: Number, required: true },
    unit: { type: String, required: true },
    supplier: { type: String },
    leadTimeDays: { type: Number, required: true },
    reviewPeriodDays: { type: Number, required: true },
    status: {
      type: String,
      enum: ["NORMAL", "WARNING", "CRITICAL"],
      default: "NORMAL",
      index: true,
    },
    currentStock: { type: Number, required: true, default: 0 },
    inTransitQuantity: { type: Number, default: 0 },
    lastRestockDate: { type: Date },
    nextReviewDate: { type: Date, required: true, index: true },
    responsiblePerson: { type: String, required: true },
    remark: { type: String },
  },
  { timestamps: true }
);

safetyStockSchema.index({ status: 1, nextReviewDate: 1 });

export const SafetyStockModel = mongoose.model<SafetyStock>(
  "SafetyStock",
  safetyStockSchema
);
