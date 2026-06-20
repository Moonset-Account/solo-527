import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Activity extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: {
      organizerId: { type: String, required: true },
      organizerName: { type: String, required: true },
    },
    required: true,
  })
  organizer: { organizerId: string; organizerName: string };

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, default: 0 })
  maxParticipants: number;

  @Prop({ required: true, default: 0 })
  currentParticipants: number;

  @Prop({ required: true, default: 0 })
  fee: number;

  @Prop({ required: true, enum: ['draft', 'published', 'closed', 'completed'], default: 'draft' })
  status: string;

  @Prop({ required: true, default: false })
  guaranteeEnabled: boolean;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
