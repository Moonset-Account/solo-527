import mongoose, { Schema, Document } from 'mongoose'

export interface IPoint extends Document {
  name: string
  address: string
  community: string
  location: {
    type: string
    coordinates: number[]
  }
  binTypes: string[]
  propertyCompany: string
  contactPerson: string
  contactPhone: string
  status: 'active' | 'inactive' | 'maintenance'
  createdAt: Date
  updatedAt: Date
}

const PointSchema: Schema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  community: { type: String, required: true, index: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  binTypes: [{ type: String }],
  propertyCompany: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactPhone: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }
}, {
  timestamps: true
})

PointSchema.index({ location: '2dsphere' })
PointSchema.index({ community: 1, status: 1 })

export default mongoose.model<IPoint>('Point', PointSchema)
