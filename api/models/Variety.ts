import mongoose, { type Document } from 'mongoose'

export interface IVariety extends Document {
  code: string
  name: string
  category: string
  growthCycle: number
  harvestStandard: string
  shelfLife: number
  status: 'active' | 'discontinued'
  createdAt: Date
  updatedAt: Date
}

const varietySchema = new mongoose.Schema<IVariety>(
  {
    code: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    category: { type: String },
    growthCycle: { type: Number },
    harvestStandard: { type: String },
    shelfLife: { type: Number },
    status: { type: String, enum: ['active', 'discontinued'], default: 'active' },
  },
  { timestamps: true },
)

export default mongoose.model<IVariety>('Variety', varietySchema)
