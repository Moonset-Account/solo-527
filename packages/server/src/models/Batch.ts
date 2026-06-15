import mongoose from "mongoose";
import type { Batch } from "@qinghe/shared";

const batchSchema = new mongoose.Schema<Batch>(
  {
    batchNo: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, index: true },
    skuName: { type: String, required: true },
    supplier: { type: String, required: true, index: true },
    supplierBatchNo: { type: String },
    productionDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true, index: true },
    quantity: { type: Number, required: true },
    receivedQuantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    temperatureZone: {
      type: String,
      enum: ["FROZEN", "CHILLED", "NORMAL"],
      required: true,
    },
    storageConditions: { type: String },
    status: {
      type: String,
      enum: [
        "RECEIVING",
        "QUALITY_CHECK",
        "STORED",
        "PARTIAL_OUT",
        "EXPIRED",
        "SCRAPPED",
        "EMPTY",
      ],
      default: "RECEIVING",
      index: true,
    },
    qualityReport: { type: String },
    inboundOrderNo: { type: String, index: true },
    operator: { type: String, required: true },
    remark: { type: String },
  },
  { timestamps: true }
);

batchSchema.index({ sku: 1, expiryDate: 1 });
batchSchema.index({ status: 1, expiryDate: 1 });

export const BatchModel = mongoose.model<Batch>("Batch", batchSchema);
