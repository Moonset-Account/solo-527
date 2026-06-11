import mongoose, { Schema, model, Document } from "mongoose";
import type { AuditLog, AuditAction, AuditTargetType } from "@/shared/types";

export interface IAuditLog extends Document, Omit<AuditLog, "id"> {}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true } as unknown as AuditAction,
    targetType: { type: String, required: true } as unknown as AuditTargetType,
    targetId: { type: String, required: true, index: true },
    detail: { type: Schema.Types.Mixed, default: {} },
    ip: String,
    createdAt: { type: String, required: true },
  },
  { collection: "audit_logs" }
);

AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const AuditLogModel = (mongoose.models as any).AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);
