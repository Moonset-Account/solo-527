import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallLogType = 'ai_generate' | 'knowledge_search';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class CallLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['ai_generate', 'knowledge_search'], index: true })
  type: CallLogType;

  @Prop({ required: true })
  prompt: string;

  @Prop({ required: true })
  response: string;

  @Prop({ required: true })
  duration: number;

  @Prop()
  tokensUsed: number;

  @Prop({ index: true })
  createdAt: Date;

  @Prop({ default: false, index: true })
  isDemo: boolean;
}

export const CallLogSchema = SchemaFactory.createForClass(CallLog);
