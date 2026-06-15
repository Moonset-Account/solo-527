import mongoose from 'mongoose';

const InspectionSchema = new mongoose.Schema({
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inspectDate: { type: Date, default: Date.now },
  sampleSize: { type: Number, required: true, default: 0 },
  passQty: { type: Number, default: 0 },
  failQty: { type: Number, default: 0 },
  defectItems: [{
    category: String,
    description: String,
    quantity: Number,
    severity: { type: String, enum: ['minor', 'major', 'critical'], default: 'minor' }
  }],
  result: { type: String, enum: ['pending', 'pass', 'fail', 'rework'], default: 'pending' },
  conclusion: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Inspection', InspectionSchema);
