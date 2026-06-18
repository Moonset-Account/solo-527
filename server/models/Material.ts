import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, unique: true },
    category: { type: String },
    unit: { type: String, required: true },
    price: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 10 },
    supplier: { type: String },
    status: {
      type: String,
      enum: ["启用", "停用"],
      default: "启用",
    },
    image: { type: String },
    remark: { type: String },
  },
  { timestamps: true, collection: "materials" }
);

export default mongoose.model("Material", materialSchema);
