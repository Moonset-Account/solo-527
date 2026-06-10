import mongoose, { type Document, type Types } from 'mongoose'

export interface ITraceability extends Document {
  batchNo: string
  harvestId: Types.ObjectId
  qrCodeData: string
  createdAt: Date
}

const traceabilitySchema = new mongoose.Schema<ITraceability>(
  {
    batchNo: { type: String, unique: true, required: true },
    harvestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Harvest', required: true },
    qrCodeData: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
)

export default mongoose.model<ITraceability>('Traceability', traceabilitySchema)
