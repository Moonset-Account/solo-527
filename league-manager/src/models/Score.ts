import mongoose, { Schema, Document, Types } from 'mongoose';
import dbConnect from '@/lib/db';

interface MatchEventSub {
  eventType: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'other';
  playerId?: Types.ObjectId;
  minute: number;
  description?: string;
}

export interface ScoreDocument extends Document {
  matchId: mongoose.Types.ObjectId;
  homeScore: number;
  awayScore: number;
  recordedBy: mongoose.Types.ObjectId;
  homeConfirmed: boolean;
  awayConfirmed: boolean;
  confirmedAt?: Date;
  events: MatchEventSub[];
}

const MatchEventSchema = new Schema<MatchEventSub>(
  {
    eventType: {
      type: String,
      enum: ['goal', 'yellow_card', 'red_card', 'substitution', 'other'],
      required: true,
    },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
    minute: { type: Number, required: true, min: 0 },
    description: { type: String },
  },
  { _id: true }
);

const ScoreSchema = new Schema<ScoreDocument>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    homeScore: { type: Number, required: true, default: 0, min: 0 },
    awayScore: { type: Number, required: true, default: 0, min: 0 },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    homeConfirmed: { type: Boolean, default: false, required: true },
    awayConfirmed: { type: Boolean, default: false, required: true },
    confirmedAt: { type: Date },
    events: { type: [MatchEventSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ScoreSchema.index({ matchId: 1 }, { unique: true });
ScoreSchema.index({ recordedBy: 1 });

export default mongoose.models.Score || mongoose.model<ScoreDocument>('Score', ScoreSchema);
