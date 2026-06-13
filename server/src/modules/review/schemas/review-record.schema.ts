import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type ReviewRecordDocument = ReviewRecord & Document;

export enum ReviewAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  TRANSFER = 'transfer',
}

@Schema({ collection: 'review_records', timestamps: true })
export class ReviewRecord {
  _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Content', required: true })
  contentId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ReviewFlow', required: true })
  flowId: string;

  @Prop()
  nodeName: string;

  @Prop()
  nodeIndex: number;

  @Prop()
  reviewer: string;

  @Prop({ type: String, enum: ReviewAction })
  action: ReviewAction;

  @Prop()
  comment: string;

  @Prop({ default: Date.now })
  reviewedAt: Date;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ReviewRecordSchema = SchemaFactory.createForClass(ReviewRecord);
