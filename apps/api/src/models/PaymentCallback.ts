import mongoose, { Schema, Document } from 'mongoose';
import type {
  PaymentCallback,
  PaymentCallbackStatus,
  RiskLevel,
} from '@seat-platform/shared';

export type IPaymentCallbackDocument = Document<unknown, unknown, Omit<PaymentCallback, 'id'>> &
  Omit<PaymentCallback, 'id'> & { _id: string };

const PaymentCallbackSchema = new Schema<IPaymentCallbackDocument>(
  {
    _id: { type: String, required: true },
    seatId: { type: String, required: true, index: true },
    seatCode: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    transactionId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'CNY' },
    callbackStatus: {
      type: String,
      enum: ['pending', 'success', 'failed', 'retrying', 'resolved'] as const satisfies readonly PaymentCallbackStatus[],
      required: true,
      default: 'pending',
      index: true,
    },
    rawPayload: { type: Schema.Types.Mixed, required: true },
    errorMessage: { type: String },
    retryCount: { type: Number, required: true, default: 0 },
    lastRetryAt: { type: String },
    remark: { type: String },
    resolution: { type: String },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'] as const satisfies readonly RiskLevel[],
      required: true,
      default: 'medium',
      index: true,
    },
    resolvedAt: { type: String },
    resolvedBy: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: 'payment_callbacks',
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

PaymentCallbackSchema.index({ createdAt: -1 });
PaymentCallbackSchema.index({ callbackStatus: 1, riskLevel: 1 });
PaymentCallbackSchema.index({ resolvedAt: 1 });

export const PaymentCallbackModel = mongoose.model<IPaymentCallbackDocument>(
  'PaymentCallback',
  PaymentCallbackSchema
);
