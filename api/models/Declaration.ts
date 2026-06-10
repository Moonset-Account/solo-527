import mongoose, { type Document, type Types } from 'mongoose'

export interface IDeclaration extends Document {
  name: string
  harvestId: Types.ObjectId
  status: 'complete' | 'missing' | 'processing'
  remark: string
  result: string
  deadline: Date
  createdAt: Date
  updatedAt: Date
}

const declarationSchema = new mongoose.Schema<IDeclaration>(
  {
    name: { type: String, required: true },
    harvestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Harvest' },
    status: {
      type: String,
      enum: ['complete', 'missing', 'processing'],
      default: 'missing',
    },
    remark: { type: String },
    result: { type: String },
    deadline: { type: Date },
  },
  { timestamps: true },
)

export default mongoose.model<IDeclaration>('Declaration', declarationSchema)
