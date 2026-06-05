import mongoose, { Schema, Document } from 'mongoose';

export interface IVenue extends Document {
  name: string;
  address: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema<IVenue>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Venue || mongoose.model<IVenue>('Venue', VenueSchema);
