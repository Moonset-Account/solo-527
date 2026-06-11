import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkerDocument = Worker & Document;

@Schema({ timestamps: true, collection: 'workers' })
export class Worker {
  _id: Types.ObjectId;

  @Prop({ required: true, type: String, trim: true })
  name: string;

  @Prop({ required: true, type: String, trim: true, unique: true })
  phone: string;

  @Prop({ required: true, type: String, trim: true, unique: true })
  idCard: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Service' }], default: [] })
  skills: Types.ObjectId[];

  @Prop({ type: Number, min: 0, max: 5, default: 5 })
  rating: number;

  @Prop({ type: String, enum: ['on', 'off'], default: 'off' })
  status: 'on' | 'off';

  @Prop({ type: String, trim: true, default: '' })
  community: string;

  @Prop({ required: true, type: Date })
  hireDate: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const WorkerSchema = SchemaFactory.createForClass(Worker);
