import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReviewNodeType } from '@/common/enums';

export type ReviewFlowDocument = ReviewFlow & Document;

@Schema({ collection: 'review_flows', timestamps: true })
export class ReviewFlow {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({
    type: [
      {
        name: { type: String },
        type: { type: String, enum: ReviewNodeType, default: ReviewNodeType.SINGLE },
        reviewers: { type: [String] },
        order: { type: Number },
      },
    ],
    default: [],
  })
  nodes: Array<{
    name: string;
    type: ReviewNodeType;
    reviewers: string[];
    order: number;
  }>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description: string;

  @Prop()
  creator: string;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ReviewFlowSchema = SchemaFactory.createForClass(ReviewFlow);
