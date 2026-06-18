import mongoose from "mongoose";

const customerTreatmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: { type: String, required: true },
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatment",
      required: true,
    },
    treatmentName: { type: String, required: true },
    totalTimes: { type: Number, required: true },
    usedTimes: { type: Number, default: 0 },
    remainingTimes: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    purchaseDate: { type: Date, required: true },
    expireDate: { type: Date },
    status: {
      type: String,
      enum: ["有效", "已用完", "已过期", "已退款"],
      default: "有效",
    },
    source: { type: String, default: "购买" },
    orderNo: { type: String },
    remark: { type: String },
    history: [
      {
        date: { type: Date, required: true },
        type: {
          type: String,
          enum: ["购买", "使用", "退款", "赠送", "调整"],
          required: true,
        },
        changeTimes: { type: Number, required: true },
        balanceAfter: { type: Number, required: true },
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
        appointmentNo: { type: String },
        operator: { type: String },
        remark: { type: String },
      },
    ],
  },
  { timestamps: true, collection: "customer_treatments" }
);

customerTreatmentSchema.index({ customerId: 1, status: 1 });

export default mongoose.model("CustomerTreatment", customerTreatmentSchema);
