import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DraftStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'sent';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class EmailDraft extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  recipient: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: String,
    required: true,
    enum: ['draft', 'pending_review', 'approved', 'rejected', 'sent'],
    default: 'draft',
    index: true,
  })
  status: DraftStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assignedTo: Types.ObjectId;

  @Prop({ default: false })
  aiGenerated: boolean;

  @Prop({ type: Number, min: 0, max: 100 })
  confidenceScore: number;

  @Prop()
  lowConfidenceReason: string;

  @Prop({ type: [String], default: [] })
  sources: string[];

  @Prop({ default: false, index: true })
  isDemo: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const EmailDraftSchema = SchemaFactory.createForClass(EmailDraft);
