import mongoose, { type Document, type Types } from 'mongoose'

export interface IFarmRecord extends Document {
  plotId: Types.ObjectId
  varietyId: Types.ObjectId
  type: 'fertilization' | 'pesticide' | 'irrigation' | 'pruning' | 'weeding' | 'other'
  content: string
  dosage: number
  unit: string
  operator: Types.ObjectId
  operateDate: Date
  photos: string[]
  status: 'pending' | 'approved' | 'rejected'
  reviewer: Types.ObjectId
  reviewRemark: string
  reviewDate: Date
  createdAt: Date
  updatedAt: Date
}

const farmRecordSchema = new mongoose.Schema<IFarmRecord>(
  {
    plotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true },
    varietyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variety' },
    type: {
      type: String,
      enum: ['fertilization', 'pesticide', 'irrigation', 'pruning', 'weeding', 'other'],
      required: true,
    },
    content: { type: String, required: true },
    dosage: { type: Number },
    unit: { type: String },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    operateDate: { type: Date, required: true },
    photos: { type: [String] },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewRemark: { type: String },
    reviewDate: { type: Date },
  },
  { timestamps: true },
)

export default mongoose.model<IFarmRecord>('FarmRecord', farmRecordSchema)
