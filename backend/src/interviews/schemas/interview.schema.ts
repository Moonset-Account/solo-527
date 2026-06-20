import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InterviewStatus } from '../../common/enums/interview-status.enum';
import { HireResult } from '../../common/enums/hire-result.enum';

export type InterviewDocument = Interview & Document;

@Schema({ timestamps: true })
export class Interview {
  _id: Types.ObjectId;

  @Prop({ required: true })
  candidateName: string;

  @Prop({ required: true })
  candidatePhone: string;

  @Prop()
  candidateEmail?: string;

  @Prop()
  position?: string;

  @Prop()
  level?: string;

  @Prop({ type: [String] })
  skills?: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  interviewerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Schedule', required: true })
  scheduleId: Types.ObjectId;

  @Prop({ required: true })
  interviewDate: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop()
  location?: string;

  @Prop()
  channel?: string;

  @Prop({
    type: String,
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED,
  })
  status: InterviewStatus;

  @Prop({
    type: String,
    enum: HireResult,
    default: HireResult.PENDING,
  })
  hireResult: HireResult;

  @Prop()
  checkInTime?: Date;

  @Prop()
  startInterviewTime?: Date;

  @Prop()
  endInterviewTime?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  remark?: string;

  @Prop()
  resumeUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);

InterviewSchema.index({ interviewerId: 1, interviewDate: 1 });
InterviewSchema.index({ status: 1, interviewDate: 1 });
InterviewSchema.index({ createdAt: -1 });
