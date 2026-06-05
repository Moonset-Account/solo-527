import mongoose, { Schema, Document } from 'mongoose';

export interface ISeason extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  appealDeadlineDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const SeasonSchema = new Schema<ISeason>(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
    appealDeadlineDays: { type: Number, default: 3 },
  },
  { timestamps: true }
);

export default mongoose.models.Season || mongoose.model<ISeason>('Season', SeasonSchema);
