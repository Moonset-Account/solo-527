import mongoose, { type Document, type Types } from 'mongoose'

export interface IPlot extends Document {
  code: string
  name: string
  area: number
  location: string
  soilType: string
  currentVariety: Types.ObjectId
  status: 'active' | 'fallow' | 'preparing'
  remark: string
  createdAt: Date
  updatedAt: Date
}

const plotSchema = new mongoose.Schema<IPlot>(
  {
    code: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    area: { type: Number },
    location: { type: String },
    soilType: { type: String },
    currentVariety: { type: mongoose.Schema.Types.ObjectId, ref: 'Variety' },
    status: { type: String, enum: ['active', 'fallow', 'preparing'], default: 'active' },
    remark: { type: String },
  },
  { timestamps: true },
)

export default mongoose.model<IPlot>('Plot', plotSchema)
