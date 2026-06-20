import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HireResult } from '../../common/enums/hire-result.enum';

export type AssessmentDocument = Assessment & Document;

@Schema({ timestamps: true })
export class Assessment {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Interview', required: true })
  interviewId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  interviewerId: Types.ObjectId;

  @Prop({ type: [{
    dimension: String,
    score: Number,
    weight: Number,
    comment: String,
  }]})
  dimensions: {
    dimension: string;
    score: number;
    weight: number;
    comment?: string;
  }[];

  @Prop()
  totalScore?: number;

  @Prop()
  technicalScore?: number;

  @Prop()
  communicationScore?: number;

  @Prop()
  problemSolvingScore?: number;

  @Prop()
  overallComment?: string;

  @Prop()
  strengths?: string;

  @Prop()
  weaknesses?: string;

  @Prop({
    type: String,
    enum: HireResult,
    default: HireResult.PENDING,
  })
  recommendation: HireResult;

  @Prop()
  suggestedLevel?: string;

  @Prop()
  suggestedSalary?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Question' })
  usedQuestions?: Types.ObjectId[];

  @Prop({ default: false })
  isFinal: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);

AssessmentSchema.index({ interviewId: 1 }, { unique: true });
AssessmentSchema.index({ interviewerId: 1, createdAt: -1 });
