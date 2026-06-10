import mongoose, { type Document, type Types } from 'mongoose'

export interface IAuditLog extends Document {
  userId: Types.ObjectId
  action: string
  module: string
  detail: string
  createdAt: Date
}

const auditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    module: { type: String, required: true },
    detail: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
)

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema)
