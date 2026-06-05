import mongoose, { Schema, Document } from 'mongoose';
import dbConnect from '@/lib/db';

export interface MessageDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: 'system' | 'review' | 'schedule' | 'score' | 'appeal';
  relatedId?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<MessageDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['system', 'review', 'schedule', 'score', 'appeal'],
      default: 'system',
      required: true,
    },
    relatedId: { type: Schema.Types.ObjectId },
    read: { type: Boolean, default: false, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MessageSchema.index({ userId: 1, read: 1 });
MessageSchema.index({ userId: 1, createdAt: -1 });
MessageSchema.index({ type: 1 });

export default mongoose.models.Message || mongoose.model<MessageDocument>('Message', MessageSchema);
