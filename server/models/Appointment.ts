import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNo: { type: String, required: true, unique: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatment",
      required: true,
    },
    treatmentName: { type: String, required: true },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      required: true,
    },
    technicianName: { type: String, required: true },
    consultantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultant",
    },
    consultantName: { type: String },
    appointmentDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    actualPrice: { type: Number },
    status: {
      type: String,
      enum: ["待确认", "已确认", "已到店", "服务中", "已完成", "已取消", "已过期"],
      default: "待确认",
    },
    paymentStatus: {
      type: String,
      enum: ["未支付", "部分支付", "已支付", "已退款"],
      default: "未支付",
    },
    paymentMethod: { type: String },
    paidAmount: { type: Number, default: 0 },
    useBalance: { type: Number, default: 0 },
    usePoints: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    source: { type: String, default: "门店" },
    remark: { type: String },
    cancelReason: { type: String },
    serviceRemark: { type: String },
    createdBy: { type: String },
    confirmedBy: { type: String },
    confirmedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true, collection: "appointments" }
);

appointmentSchema.index({ appointmentDate: 1, status: 1 });
appointmentSchema.index({ technicianId: 1, appointmentDate: 1 });

export default mongoose.model("Appointment", appointmentSchema);
