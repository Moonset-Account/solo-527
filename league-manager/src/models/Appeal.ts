import mongoose, { Schema, Document } from 'mongoose';
import dbConnect from '@/lib/db';

export interface AppealDocument extends Document {
  matchId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  reason: string;
  evidence: [string];
  status: 'pending' | 'upheld' | 'rejected' | 'expired';
  resolvedBy?: mongoose.Types.ObjectId;
  resolution?: string;
  deadline: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

const AppealSchema = new Schema<AppealDocument>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    evidence: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'upheld', 'rejected', 'expired'],
      default: 'pending',
      required: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolution: { type: String },
    deadline: { type: Date, required: true },
    resolvedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AppealSchema.index({ matchId: 1 });
AppealSchema.index({ submittedBy: 1 });
AppealSchema.index({ status: 1 });
AppealSchema.index({ deadline: 1 });

export default mongoose.models.Appeal || mongoose.model<AppealDocument>('Appeal', AppealSchema);
