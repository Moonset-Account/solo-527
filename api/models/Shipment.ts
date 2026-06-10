import mongoose, { type Document, type Types } from 'mongoose'

export interface IShipment extends Document {
  orderId: Types.ObjectId
  sortingOrderId: Types.ObjectId
  quantity: number
  shipDate: Date
  trackingNo: string
  createdAt: Date
}

const shipmentSchema = new mongoose.Schema<IShipment>(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    sortingOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SortingOrder', required: true },
    quantity: { type: Number, required: true },
    shipDate: { type: Date, required: true },
    trackingNo: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
)

export default mongoose.model<IShipment>('Shipment', shipmentSchema)
