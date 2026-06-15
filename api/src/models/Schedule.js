import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  productionLine: { type: String, default: '' },
  plannedDate: { type: Date, required: true },
  shift: { type: String, enum: ['morning', 'afternoon', 'night', 'full'], default: 'full' },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  plannedHours: { type: Number, default: 8 },
  notes: { type: String, default: '' },
  equipment: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Schedule', ScheduleSchema);
