import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
  CODING = 'coding',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

@Schema({ timestamps: true })
export class Question {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: String,
    enum: QuestionType,
    required: true,
  })
  type: QuestionType;

  @Prop({
    type: String,
    enum: DifficultyLevel,
    required: true,
  })
  difficulty: DifficultyLevel;

  @Prop({ required: true })
  category: string;

  @Prop({ type: [String] })
  tags: string[];

  @Prop()
  referenceAnswer?: string;

  @Prop()
  analysis?: string;

  @Prop({ type: [String] })
  options?: string[];

  @Prop({ type: [Number] })
  correctAnswers?: number[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ default: 0 })
  correctRate: number;

  @Prop({ type: Number, default: 60 })
  defaultScore: number;

  @Prop()
  estimatedTime?: number;

  createdAt: Date;
  updatedAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

QuestionSchema.index({ category: 1, difficulty: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ isActive: 1 });
