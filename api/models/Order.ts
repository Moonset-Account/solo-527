import mongoose, { type Document, type Types } from 'mongoose'

export interface IOrder extends Document {
  orderNo: string
  customer: string
  varietyId: Types.ObjectId
  quantity: number
  unit: string
  unitPrice: number
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  deadline: Date
  createdAt: Date
  updatedAt: Date
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    orderNo: { type: String, unique: true, required: true },
    customer: { type: String, required: true },
    varietyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variety', required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    unitPrice: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
      default: 'pending',
    },
    deadline: { type: Date },
  },
  { timestamps: true },
)

export default mongoose.model<IOrder>('Order', orderSchema)
