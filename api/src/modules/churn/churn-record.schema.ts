import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ChurnRecord {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Lead' })
  leadId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop()
  detail: string;

  @Prop({ required: true, type: Date })
  churnedAt: Date;

  @Prop({ default: false })
  canRecall: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type ChurnRecordDocument = ChurnRecord & Document;
export const ChurnSchema = SchemaFactory.createForClass(ChurnRecord);

ChurnSchema.index({ leadId: 1 });
ChurnSchema.index({ reason: 1 });
ChurnSchema.index({ churnedAt: -1 });
