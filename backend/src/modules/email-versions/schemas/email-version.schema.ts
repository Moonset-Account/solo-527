import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
export class EmailVersion extends Document {
  @Prop({ type: Types.ObjectId, ref: 'EmailDraft', required: true, index: true })
  draftId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  comment: string;

  @Prop()
  createdAt: Date;
}

export const EmailVersionSchema = SchemaFactory.createForClass(EmailVersion);
