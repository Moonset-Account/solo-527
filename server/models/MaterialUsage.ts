import mongoose from "mongoose";

const materialUsageSchema = new mongoose.Schema(
  {
    usageNo: { type: String, required: true, unique: true },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    appointmentNo: { type: String },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: { type: String },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
    },
    technicianName: { type: String },
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatment",
    },
    treatmentName: { type: String },
    items: [
      {
        materialId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
          required: true,
        },
        materialName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String },
        unitCost: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 },
      },
    ],
    totalCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["草稿", "已确认", "已撤销"],
      default: "草稿",
    },
    type: {
      type: String,
      enum: ["服务消耗", "领用", "损耗", "盘点调整"],
      default: "服务消耗",
    },
    operator: { type: String },
    remark: { type: String },
    originalRecord: { type: mongoose.Schema.Types.Mixed },
    changeHistory: [
      {
        changedAt: { type: Date, required: true },
        changedBy: { type: String },
        changeType: { type: String },
        before: { type: mongoose.Schema.Types.Mixed },
        after: { type: mongoose.Schema.Types.Mixed },
        remark: { type: String },
      },
    ],
  },
  { timestamps: true, collection: "material_usages" }
);

export default mongoose.model("MaterialUsage", materialUsageSchema);
