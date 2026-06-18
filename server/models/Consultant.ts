import mongoose from "mongoose";

const consultantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    level: {
      type: String,
      enum: ["初级顾问", "中级顾问", "高级顾问", "顾问主管"],
      default: "初级顾问",
    },
    status: {
      type: String,
      enum: ["在职", "休假", "离职"],
      default: "在职",
    },
    baseSalary: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0.05 },
    hireDate: { type: Date },
    remark: { type: String },
  },
  { timestamps: true, collection: "consultants" }
);

export default mongoose.model("Consultant", consultantSchema);
