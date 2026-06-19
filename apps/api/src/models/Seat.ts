import mongoose, { Schema, Document, Types } from 'mongoose';
import type { Seat, SeatStatus, TrialStatus } from '@seat-platform/shared';

export type ISeatDocument = Document<unknown, unknown, Omit<Seat, 'id'>> &
  Omit<Seat, 'id'> & { _id: string };

const SeatSchema = new Schema<ISeatDocument>(
  {
    _id: { type: String, required: true },
    seatCode: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, index: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive', 'trial', 'expired', 'suspended'] as const satisfies readonly SeatStatus[],
      required: true,
      index: true,
    },
    trialStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'ended'] as const satisfies readonly TrialStatus[],
      required: true,
      default: 'not_started',
    },
    trialStartDate: { type: String },
    trialEndDate: { type: String },
    quota: { type: Number, required: true },
    usedQuota: { type: Number, required: true, default: 0 },
    usageThreshold: { type: Number, required: true, default: 80 },
    warningThreshold: { type: Number, required: true, default: 70 },
    criticalThreshold: { type: Number, required: true, default: 95 },
    expireDate: { type: String, index: true },
    ownerId: { type: String },
    ownerName: { type: String, index: true },
    ownerEmail: { type: String },
    apiKeys: [{ type: String }],
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    toJSON: {
      transform: (_doc, ret) => {
        const r = ret as Record<string, unknown>;
        r.id = r._id;
        delete r._id;
        delete r.__v;
      },
    },
  }
);

SeatSchema.index({ updatedAt: -1 });
SeatSchema.index({ createdAt: -1 });

export const SeatModel = mongoose.model<ISeatDocument>('Seat', SeatSchema);
