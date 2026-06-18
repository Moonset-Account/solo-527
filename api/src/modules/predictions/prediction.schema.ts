import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Prediction {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Lead', unique: true })
  leadId: Types.ObjectId;

  @Prop({ required: true })
  score: number;

  @Prop({
    required: true,
    type: [
      {
        name: { type: String, required: true },
        weight: { type: Number, required: true },
        value: { type: Number, required: true },
      },
    ],
  })
  factors: { name: string; weight: number; value: number }[];

  @Prop({ required: true, enum: ['low', 'medium', 'high'] })
  riskLevel: string;

  @Prop()
  updatedAt: Date;
}

export type PredictionDocument = Prediction & Document;
export const PredictionSchema = SchemaFactory.createForClass(Prediction);

PredictionSchema.index({ leadId: 1 });
PredictionSchema.index({ riskLevel: 1 });
PredictionSchema.index({ score: -1 });
