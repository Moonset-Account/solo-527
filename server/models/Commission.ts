import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    commissionNo: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["技师提成", "顾问提成"],
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    appointmentNo: { type: String, required: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: { type: String },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "staffModel",
    },
    staffModel: {
      type: String,
      enum: ["Technician", "Consultant"],
      required: true,
    },
    staffName: { type: String, required: true },
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Treatment",
    },
    treatmentName: { type: String },
    serviceAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["待结算", "已结算", "已撤销"],
      default: "待结算",
    },
    settlementDate: { type: Date },
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
  { timestamps: true, collection: "commissions" }
);

export default mongoose.model("Commission", commissionSchema);
