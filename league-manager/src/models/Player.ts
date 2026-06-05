import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  number: number;
  position: string;
  teamId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, trim: true },
    number: { type: Number, required: true },
    position: { type: String, required: true, trim: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);
