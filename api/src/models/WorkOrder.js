import mongoose from 'mongoose';

const WorkOrderSchema = new mongoose.Schema({
  orderNo: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  productCode: { type: String, default: '' },
  quantity: { type: Number, required: true },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  status: {
    type: String,
    enum: ['draft', 'pending', 'in_production', 'quality_check', 'completed', 'hold', 'cancelled'],
    default: 'draft'
  },
  orderDate: { type: Date, default: Date.now },
  plannedStartDate: { type: Date },
  plannedEndDate: { type: Date, required: true },
  actualStartDate: { type: Date },
  actualEndDate: { type: Date },
  customer: { type: String, default: '' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remark: { type: String, default: '' },
  producedQty: { type: Number, default: 0 },
  workHours: { type: Number, default: 0 },
  equipmentId: { type: String, default: '' },
  equipmentDown: { type: Boolean, default: false },
  materialStatus: { type: String, enum: ['not_ready', 'partial', 'ready'], default: 'not_ready' },
  qualityPassRate: { type: Number, default: 0 },
  riskFlags: [{ type: String }]
}, { timestamps: true });

WorkOrderSchema.index({ status: 1, plannedEndDate: 1 });
WorkOrderSchema.index({ orderNo: 1 });

export default mongoose.model('WorkOrder', WorkOrderSchema);
