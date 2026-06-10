import mongoose, { type Document, type Types } from 'mongoose'

export interface ISortingOrder extends Document {
  orderNo: string
  harvestId: Types.ObjectId
  sorter: Types.ObjectId
  status: 'pending' | 'sorting' | 'completed' | 'inspected'
  grades: { grade: string; quantity: number; unit: string }[]
  packaging: { material: string; weight: number; unit: string }
  inspector: Types.ObjectId
  inspectResult: 'pass' | 'fail' | 'pending'
  createdAt: Date
  updatedAt: Date
}

const sortingOrderSchema = new mongoose.Schema<ISortingOrder>(
  {
    orderNo: { type: String, unique: true, required: true },
    harvestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Harvest', required: true },
    sorter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'sorting', 'completed', 'inspected'],
      default: 'pending',
    },
    grades: [
      {
        grade: { type: String },
        quantity: { type: Number },
        unit: { type: String },
      },
    ],
    packaging: {
      material: { type: String },
      weight: { type: Number },
      unit: { type: String },
    },
    inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    inspectResult: {
      type: String,
      enum: ['pass', 'fail', 'pending'],
      default: 'pending',
    },
  },
  { timestamps: true },
)

export default mongoose.model<ISortingOrder>('SortingOrder', sortingOrderSchema)
