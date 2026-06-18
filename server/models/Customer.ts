import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    gender: { type: String, enum: ["男", "女", "未知"], default: "未知" },
    birthday: { type: Date },
    avatar: { type: String },
    level: {
      type: String,
      enum: ["普通", "银卡", "金卡", "钻石"],
      default: "普通",
    },
    balance: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    source: { type: String },
    remark: { type: String },
    tags: [{ type: String }],
  },
  { timestamps: true, collection: "customers" }
);

export default mongoose.model("Customer", customerSchema);
