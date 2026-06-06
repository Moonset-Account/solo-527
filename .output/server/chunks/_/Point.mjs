import mongoose, { Schema } from 'mongoose';

const PointSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  community: { type: String, required: true, index: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  binTypes: [{ type: String }],
  propertyCompany: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactPhone: { type: String, required: true },
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance"],
    default: "active"
  }
}, {
  timestamps: true
});
PointSchema.index({ location: "2dsphere" });
PointSchema.index({ community: 1, status: 1 });
const Point = mongoose.model("Point", PointSchema);

export { Point as P };
//# sourceMappingURL=Point.mjs.map
