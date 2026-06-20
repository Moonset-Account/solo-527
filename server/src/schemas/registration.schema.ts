import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Registration extends Document {
  @Prop({ required: true })
  activityId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true, enum: ['registered', 'cancelled', 'attended', 'absent'], default: 'registered' })
  status: string;

  @Prop({ required: true, default: false })
  feePaid: boolean;

  @Prop()
  paidAt: Date;
}

export const RegistrationSchema = SchemaFactory.createForClass(Registration);
