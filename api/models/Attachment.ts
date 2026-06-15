import mongoose from 'mongoose'

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    url: { type: String, required: true },
    relatedType: {
      type: String,
      enum: ['schedule', 'appointment', 'closure'],
      required: true,
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
    uploadedBy: { type: String, default: '' },
  },
  { timestamps: true },
)

attachmentSchema.index({ relatedType: 1, relatedId: 1 })

export default mongoose.model('Attachment', attachmentSchema)
