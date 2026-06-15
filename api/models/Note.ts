import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    relatedType: {
      type: String,
      enum: ['schedule', 'appointment', 'closure'],
      required: true,
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true },
)

noteSchema.index({ relatedType: 1, relatedId: 1 })

export default mongoose.model('Note', noteSchema)
