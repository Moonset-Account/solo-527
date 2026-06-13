import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';
import { ReviewNodeType } from '../../common/enums';

export type ReviewFlowDocument = ReviewFlow & Document;

@Prop()
class ReviewNode {
  @Prop()
  name: string;

  @Prop({ type: String, enum: ReviewNodeType, default: ReviewNodeType.SINGLE })
  type: ReviewNodeType;

  @Prop({ type: [String] })
  reviewers: string[];

  @Prop()
  order: number;
}

@Schema({ collection: 'review_flows', timestamps: true })
export class ReviewFlow extends BaseSchema {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: [ReviewNode] })
  nodes: ReviewNode[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description?: string;

  @Prop()
  creator: string;
}

export const ReviewFlowSchema = SchemaFactory.createForClass(ReviewFlow);
