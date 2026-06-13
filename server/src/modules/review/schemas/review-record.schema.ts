import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type ReviewRecordDocument = ReviewRecord & Document;

export enum ReviewAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  TRANSFER = 'transfer',
}

@Schema({ collection: 'review_records', timestamps: true })
export class ReviewRecord extends BaseSchema {
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
  comment?: string;

  @Prop({ default: Date.now })
  reviewedAt: Date;
}

export const ReviewRecordSchema = SchemaFactory.createForClass(ReviewRecord);
