import mongoose, { Schema, Document } from 'mongoose';
import dbConnect from '@/lib/db';

export interface StandingDocument extends Document {
  teamId: mongoose.Types.ObjectId;
  seasonId: mongoose.Types.ObjectId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

const StandingSchema = new Schema<StandingDocument>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
    played: { type: Number, default: 0, min: 0, required: true },
    won: { type: Number, default: 0, min: 0, required: true },
    drawn: { type: Number, default: 0, min: 0, required: true },
    lost: { type: Number, default: 0, min: 0, required: true },
    goalsFor: { type: Number, default: 0, min: 0, required: true },
    goalsAgainst: { type: Number, default: 0, min: 0, required: true },
    points: { type: Number, default: 0, min: 0, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StandingSchema.index({ seasonId: 1, teamId: 1 }, { unique: true });
StandingSchema.index({ seasonId: 1, points: -1 });

export default mongoose.models.Standing || mongoose.model<StandingDocument>('Standing', StandingSchema);
