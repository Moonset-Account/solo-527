import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    module: { type: String, required: true },
    operatorId: { type: String, default: '' },
    operatorName: { type: String, default: '' },
    targetId: { type: String, default: '' },
    targetType: { type: String, default: '' },
    detail: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true },
)

auditLogSchema.index({ module: 1, createdAt: 1 })
auditLogSchema.index({ operatorId: 1, createdAt: 1 })

export default mongoose.model('AuditLog', auditLogSchema)
