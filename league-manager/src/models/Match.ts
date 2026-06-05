import mongoose, { Schema, Document } from 'mongoose';
import dbConnect from '@/lib/db';

export interface MatchDocument extends Document {
  seasonId: mongoose.Types.ObjectId;
  homeTeamId: mongoose.Types.ObjectId;
  awayTeamId: mongoose.Types.ObjectId;
  venueId?: mongoose.Types.ObjectId;
  refereeId?: mongoose.Types.ObjectId;
  matchDate: Date;
  status: 'scheduled' | 'adjusting' | 'confirmed' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';
  round?: number;
  adjustmentReason?: string;
  adjustedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<MatchDocument>(
  {
    seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
    homeTeamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    awayTeamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    venueId: { type: Schema.Types.ObjectId, ref: 'Venue' },
    refereeId: { type: Schema.Types.ObjectId, ref: 'User' },
    matchDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'adjusting', 'confirmed', 'in_progress', 'completed', 'postponed', 'cancelled'],
      default: 'scheduled',
      required: true,
    },
    round: { type: Number },
    adjustmentReason: { type: String },
    adjustedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

MatchSchema.index({ seasonId: 1, round: 1 });
MatchSchema.index({ homeTeamId: 1 });
MatchSchema.index({ awayTeamId: 1 });
MatchSchema.index({ status: 1 });
MatchSchema.index({ matchDate: 1 });
MatchSchema.index({ refereeId: 1 });

export default mongoose.models.Match || mongoose.model<MatchDocument>('Match', MatchSchema);
