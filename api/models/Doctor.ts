import mongoose from 'mongoose'

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    department: { type: String, required: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('Doctor', doctorSchema)
