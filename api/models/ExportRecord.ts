import mongoose from 'mongoose'

const exportRecordSchema = new mongoose.Schema(
  {
    operatorId: { type: String, default: '' },
    operatorName: { type: String, default: '' },
    filterCriteria: { type: mongoose.Schema.Types.Mixed },
    arrivalRate: { type: Number, default: 0 },
    closureCount: { type: Number, default: 0 },
    lastChangeAt: { type: Date },
    fileUrl: { type: String, default: '' },
  },
  { timestamps: true },
)

exportRecordSchema.index({ operatorId: 1, generatedAt: 1 })

export default mongoose.model('ExportRecord', exportRecordSchema)
