import mongoose from 'mongoose'

const scheduleSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true },
    timeSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
    shiftType: {
      type: String,
      enum: ['morning', 'afternoon', 'full_day'],
      required: true,
    },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true },
)

scheduleSchema.index({ doctorId: 1, date: 1 })

export default mongoose.model('Schedule', scheduleSchema)
