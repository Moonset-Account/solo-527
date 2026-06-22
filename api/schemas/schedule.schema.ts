import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'schedules' })
export class Schedule extends Document {
  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  teamId: string;

  @Prop({ required: true })
  teamName: string;

  @Prop({ type: [{ batchId: String, batchNo: String, recipeName: String, plannedQty: Number, unit: String }] })
  batches: { batchId: string; batchNo: string; recipeName: string; plannedQty: number; unit: string }[];

  @Prop({ required: true, enum: ['planned', 'in_progress', 'completed'], default: 'planned' })
  status: string;

  @Prop({ default: false })
  isSandbox: boolean;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
