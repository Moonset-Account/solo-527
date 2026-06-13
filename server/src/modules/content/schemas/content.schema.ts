import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { ContentStatus } from '@/common/enums';

export type ContentDocument = Content & Document;

@Schema({ collection: 'contents', timestamps: true })
export class Content {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  topic: string;

  @Prop()
  script: string;

  @Prop({ type: String, enum: ContentStatus, default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ReviewFlow' })
  reviewFlowId: string;

  @Prop({ default: 0 })
  currentReviewNodeIndex: number;

  @Prop({ type: [String] })
  currentReviewers: string[];

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'PlatformAccount' }] })
  targetPlatforms: string[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Material' })
  materialId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Schedule' })
  scheduleId: string;

  @Prop()
  assignee: string;

  @Prop()
  creator: string;

  @Prop()
  publisher: string;

  @Prop()
  publishTime: Date;

  @Prop()
  publishResult: string;

  @Prop({
    type: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        size: { type: Number },
      },
    ],
    default: [],
  })
  attachments: Array<{ name: string; url: string; type: string; size: number }>;

  @Prop()
  remark: string;

  @Prop({
    type: [
      {
        field: { type: String },
        oldValue: { type: SchemaTypes.Mixed },
        newValue: { type: SchemaTypes.Mixed },
        operator: { type: String },
        operatedAt: { type: Date, default: Date.now },
        remark: { type: String },
      },
    ],
    default: [],
  })
  history: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    operator: string;
    operatedAt: Date;
    remark?: string;
  }>;

  @Prop({ default: false })
  isException: boolean;

  @Prop()
  exceptionReason: string;

  @Prop()
  exceptionConclusion: string;

  @Prop()
  exceptionHandler: string;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ContentSchema = SchemaFactory.createForClass(Content);
