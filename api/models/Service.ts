import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true },
)

serviceSchema.index({ category: 1 })

export default mongoose.model('Service', serviceSchema)
