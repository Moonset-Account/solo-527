import mongoose, { type Document } from 'mongoose'

export interface IRole extends Document {
  name: string
  permissions: string[]
  createdAt: Date
}

const roleSchema = new mongoose.Schema<IRole>(
  {
    name: { type: String, unique: true, required: true },
    permissions: { type: [String], required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
)

export default mongoose.model<IRole>('Role', roleSchema)
