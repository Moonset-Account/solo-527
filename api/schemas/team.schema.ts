import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'teams' })
export class Team extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], default: [] })
  members: string[];

  @Prop({ default: false })
  isSandbox: boolean;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
