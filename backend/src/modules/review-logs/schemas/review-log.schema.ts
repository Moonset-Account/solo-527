import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewAction = 'approve' | 'reject';

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
export class ReviewLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'EmailDraft', required: true, index: true })
  draftId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reviewerId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['approve', 'reject'] })
  action: ReviewAction;

  @Prop()
  comment: string;

  @Prop()
  createdAt: Date;

  @Prop({ default: false, index: true })
  isDemo: boolean;
}

export const ReviewLogSchema = SchemaFactory.createForClass(ReviewLog);
