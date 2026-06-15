import mongoose from "mongoose";
import type { Inventory, InventoryTransaction } from "@qinghe/shared";

const inventorySchema = new mongoose.Schema<Inventory>(
  {
    batchId: { type: String, required: true, index: true },
    batchNo: { type: String, required: true, index: true },
    sku: { type: String, required: true, index: true },
    skuName: { type: String, required: true },
    locationId: { type: String, required: true, index: true },
    locationCode: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    availableQuantity: { type: Number, required: true, default: 0 },
    reservedQuantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    status: {
      type: String,
      enum: ["NORMAL", "LOCKED", "RESERVED", "DAMAGED"],
      default: "NORMAL",
      index: true,
    },
    temperatureZone: {
      type: String,
      enum: ["FROZEN", "CHILLED", "NORMAL"],
      required: true,
    },
    expiryDate: { type: Date, required: true, index: true },
    lastCountDate: { type: Date },
    accuracyRate: { type: Number },
  },
  { timestamps: true }
);

inventorySchema.index({ sku: 1, locationCode: 1 }, { unique: true });
inventorySchema.index({ expiryDate: 1, status: 1 });

export const InventoryModel = mongoose.model<Inventory>(
  "Inventory",
  inventorySchema
);

const transactionSchema = new mongoose.Schema<InventoryTransaction>(
  {
    transactionNo: { type: String, required: true, unique: true, index: true },
    batchId: { type: String, required: true, index: true },
    batchNo: { type: String, required: true, index: true },
    sku: { type: String, required: true, index: true },
    skuName: { type: String, required: true },
    operationType: {
      type: String,
      enum: ["INBOUND", "OUTBOUND", "TRANSFER", "ADJUST", "COUNT", "SCRAP"],
      required: true,
      index: true,
    },
    fromLocationId: { type: String },
    fromLocationCode: { type: String },
    toLocationId: { type: String },
    toLocationCode: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    referenceNo: { type: String },
    operator: { type: String, required: true },
    operationTime: { type: Date, required: true, default: Date.now, index: true },
    remark: { type: String },
  },
  { timestamps: true }
);

transactionSchema.index({ operationTime: -1 });
transactionSchema.index({ sku: 1, operationType: 1, operationTime: -1 });

export const InventoryTransactionModel = mongoose.model<InventoryTransaction>(
  "InventoryTransaction",
  transactionSchema
);
