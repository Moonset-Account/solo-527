import mongoose, { type Document, type Types } from 'mongoose'

export interface IHarvest extends Document {
  batchNo: string
  plotId: Types.ObjectId
  varietyId: Types.ObjectId
  quantity: number
  unit: string
  qualityGrade: 'premium' | 'first' | 'second' | 'third'
  harvester: Types.ObjectId
  harvestDate: Date
  remark: string
  createdAt: Date
  updatedAt: Date
}

const harvestSchema = new mongoose.Schema<IHarvest>(
  {
    batchNo: { type: String, unique: true, required: true },
    plotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true },
    varietyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variety', required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    qualityGrade: {
      type: String,
      enum: ['premium', 'first', 'second', 'third'],
      default: 'first',
    },
    harvester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    harvestDate: { type: Date, required: true },
    remark: { type: String },
  },
  { timestamps: true },
)

export default mongoose.model<IHarvest>('Harvest', harvestSchema)
