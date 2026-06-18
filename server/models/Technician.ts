import mongoose from "mongoose";

const technicianSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    idCard: { type: String },
    level: {
      type: String,
      enum: ["初级", "中级", "高级", "技师长"],
      default: "初级",
    },
    specialties: [{ type: String }],
    status: {
      type: String,
      enum: ["在职", "休假", "离职"],
      default: "在职",
    },
    hireDate: { type: Date },
    baseSalary: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0.1 },
    avatar: { type: String },
    remark: { type: String },
  },
  { timestamps: true, collection: "technicians" }
);

export default mongoose.model("Technician", technicianSchema);
