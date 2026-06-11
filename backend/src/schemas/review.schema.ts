import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

export type FollowUpStatus = 'pending' | 'done';

@Schema({ timestamps: true, collection: 'reviews' })
export class Review {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Order', unique: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  rating: number;

  @Prop({ type: [{ type: String, trim: true }], default: [] })
  tags: string[];

  @Prop({ type: String, trim: true, default: '' })
  content: string;

  @Prop({ type: String, trim: true, default: '' })
  reply: string;

  @Prop({
    required: true,
    type: String,
    enum: ['pending', 'done'],
    default: 'pending',
    index: true,
  })
  followUpStatus: FollowUpStatus;

  @Prop({ type: String, trim: true, default: '' })
  followUpContent: string;

  @Prop({ type: String, trim: true, default: '' })
  followUpBy: string;

  @Prop({ type: Date })
  followUpAt: Date;

  @Prop({ type: Date })
  createdAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
