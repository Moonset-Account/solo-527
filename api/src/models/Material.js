import mongoose from 'mongoose';

const MaterialSchema = new mongoose.Schema({
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  items: [{
    code: { type: String, required: true },
    name: { type: String, required: true },
    requiredQty: { type: Number, required: true },
    preparedQty: { type: Number, default: 0 },
    unit: { type: String, default: 'PCS' },
    location: { type: String, default: '' },
    status: { type: String, enum: ['missing', 'partial', 'ready'], default: 'missing' },
    remark: { type: String, default: '' }
  }],
  overallStatus: { type: String, enum: ['not_ready', 'partial', 'ready'], default: 'not_ready' },
  preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remark: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Material', MaterialSchema);
