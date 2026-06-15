import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  batchNo: { type: String, required: true, unique: true },
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  productionLine: { type: String, default: '' },
  responsibleId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assistantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rawMaterialLots: [{
    materialCode: String,
    lotNo: String,
    quantity: Number,
    supplier: String
  }],
  produceDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'producing', 'completed', 'scrapped'], default: 'pending' },
  traceRemark: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Batch', BatchSchema);
