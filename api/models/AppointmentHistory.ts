import mongoose from 'mongoose'

const appointmentHistorySchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    fromStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'arrived', 'completed', 'no_show', 'cancelled'],
      required: true,
    },
    toStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'arrived', 'completed', 'no_show', 'cancelled'],
      required: true,
    },
    changedBy: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
    remark: { type: String },
  },
  { timestamps: true },
)

appointmentHistorySchema.index({ appointmentId: 1, changedAt: 1 })

export default mongoose.model('AppointmentHistory', appointmentHistorySchema)
