import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';
import { ContentStatus } from '../../common/enums';

export type ContentDocument = Content & Document;

@Prop()
class Attachment {
  @Prop()
  name: string;

  @Prop()
  url: string;

  @Prop()
  type: string;

  @Prop()
  size: number;
}

@Prop()
class HistoryRecord {
  @Prop()
  field: string;

  @Prop()
  oldValue: any;

  @Prop()
  newValue: any;

  @Prop()
  operator: string;

  @Prop({ default: Date.now })
  operatedAt: Date;

  @Prop()
  remark?: string;
}

@Schema({ collection: 'contents', timestamps: true })
export class Content extends BaseSchema {
  @Prop({ required: true })
  title: string;

  @Prop()
  topic: string;

  @Prop()
  script: string;

  @Prop({ type: String, enum: ContentStatus, default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ReviewFlow' })
  reviewFlowId?: string;

  @Prop({ default: 0 })
  currentReviewNodeIndex: number;

  @Prop()
  currentReviewers?: string[];

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'PlatformAccount' }] })
  targetPlatforms: string[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Material' })
  materialId?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Schedule' })
  scheduleId?: string;

  @Prop()
  assignee?: string;

  @Prop()
  creator: string;

  @Prop()
  publisher?: string;

  @Prop()
  publishTime?: Date;

  @Prop()
  publishResult?: string;

  @Prop({ type: [Attachment] })
  attachments: Attachment[];

  @Prop()
  remark?: string;

  @Prop({ type: [HistoryRecord] })
  history: HistoryRecord[];

  @Prop({ default: false })
  isException: boolean;

  @Prop()
  exceptionReason?: string;

  @Prop()
  exceptionConclusion?: string;

  @Prop()
  exceptionHandler?: string;
}

export const ContentSchema = SchemaFactory.createForClass(Content);
