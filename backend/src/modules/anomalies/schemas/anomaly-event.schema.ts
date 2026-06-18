import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'anomaly_events' })
export class AnomalyEvent extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Anomaly', required: true, index: true })
  anomalyId: Types.ObjectId;

  @Prop({ required: true })
  eventType: string;

  @Prop()
  description: string;

  @Prop({ type: Object })
  before: any;

  @Prop({ type: Object })
  after: any;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  operatorId: Types.ObjectId;

  @Prop()
  operatorName: string;

  createdAt: Date;
}

export const AnomalyEventSchema = SchemaFactory.createForClass(AnomalyEvent);
AnomalyEventSchema.index({ anomalyId: 1, createdAt: -1 });
