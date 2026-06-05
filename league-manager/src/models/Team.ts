import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  captainId: Types.ObjectId;
  seasonId: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  rosterLocked: boolean;
  rosterLockedAt?: Date;
  players: Types.ObjectId[];
  reviewComment?: string;
  reviewedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    captainId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rosterLocked: { type: Boolean, default: false },
    rosterLockedAt: { type: Date },
    players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    reviewComment: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
