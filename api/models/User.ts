import mongoose, { type Document, type Types } from 'mongoose'

export interface IUser extends Document {
  username: string
  password: string
  name: string
  role: Types.ObjectId
  active: boolean
  createdAt: Date
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
)

export default mongoose.model<IUser>('User', userSchema)
