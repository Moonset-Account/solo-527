import mongoose from "mongoose";
import type { StatusHistory } from "@qinghe/shared";

const statusHistorySchema = new mongoose.Schema<StatusHistory>(
  {
    entityId: { type: String, required: true, index: true },
    entityType: {
      type: String,
      enum: [
        "BATCH",
        "INVENTORY",
        "TRANSFER",
        "RECEIPT_DIFF",
        "SAFETY_STOCK",
        "LOCATION",
      ],
      required: true,
      index: true,
    },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    reason: { type: String, required: true },
    operator: { type: String, required: true },
    operationTime: { type: Date, required: true, default: Date.now, index: true },
    extraData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

statusHistorySchema.index(
  { entityType: 1, entityId: 1, operationTime: -1 }
);

export const StatusHistoryModel = mongoose.model<StatusHistory>(
  "StatusHistory",
  statusHistorySchema
);

export async function recordStatusChange(
  input: Omit<StatusHistory, "_id" | "operationTime" | "createdAt" | "updatedAt"> & {
    operationTime?: Date;
  }
): Promise<StatusHistory> {
  return StatusHistoryModel.create({
    ...input,
    operationTime: input.operationTime || new Date(),
  });
}
