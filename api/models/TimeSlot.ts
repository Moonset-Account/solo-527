import mongoose from 'mongoose'

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    label: { type: String, required: true },
  },
  { timestamps: true },
)

export default mongoose.model('TimeSlot', timeSlotSchema)
