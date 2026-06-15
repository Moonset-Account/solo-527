import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
    date: { type: String, required: true },
    timeSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'arrived', 'completed', 'no_show', 'cancelled'],
      default: 'pending',
    },
    noShowReason: { type: String },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true },
)

appointmentSchema.index({ doctorId: 1, date: 1 })
appointmentSchema.index({ status: 1 })

export default mongoose.model('Appointment', appointmentSchema)
