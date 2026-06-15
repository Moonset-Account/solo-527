import mongoose from 'mongoose'

const closureSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    startTime: { type: String },
    endTime: { type: String },
    reason: { type: String, required: true },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true },
)

closureSchema.index({ date: 1 })

export default mongoose.model('Closure', closureSchema)
