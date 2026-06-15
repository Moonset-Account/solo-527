import mongoose from "mongoose";
import type { Location } from "@qinghe/shared";

const locationSchema = new mongoose.Schema<Location>(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    zone: { type: String, required: true, index: true },
    aisle: { type: String, required: true },
    shelf: { type: String, required: true },
    layer: { type: String, required: true },
    position: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "STORAGE",
        "PICKING",
        "RECEIVING",
        "SHIPPING",
        "PROCESSING",
        "RETURN",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "FULL", "LOCKED"],
      default: "ACTIVE",
      index: true,
    },
    temperatureZone: {
      type: String,
      enum: ["FROZEN", "CHILLED", "NORMAL"],
      required: true,
    },
    maxCapacity: { type: Number, required: true },
    currentCapacity: { type: Number, required: true, default: 0 },
    capacityUnit: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

locationSchema.index({ zone: 1, type: 1 });
locationSchema.index({ temperatureZone: 1, status: 1 });

export const LocationModel = mongoose.model<Location>("Location", locationSchema);
