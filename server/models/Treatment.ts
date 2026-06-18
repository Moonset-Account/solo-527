import mongoose from "mongoose";

const treatmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    cost: { type: Number, default: 0 },
    description: { type: String },
    materials: [
      {
        materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material" },
        name: { type: String },
        quantity: { type: Number, default: 0 },
        unit: { type: String },
      },
    ],
    suitableFor: [{ type: String }],
    status: {
      type: String,
      enum: ["上架", "下架"],
      default: "上架",
    },
    sortOrder: { type: Number, default: 0 },
    image: { type: String },
  },
  { timestamps: true, collection: "treatments" }
);

export default mongoose.model("Treatment", treatmentSchema);
