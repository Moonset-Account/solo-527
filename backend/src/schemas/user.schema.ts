import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, type: String, trim: true })
  name: string;

  @Prop({ required: true, type: String, trim: true, unique: true })
  phone: string;

  @Prop({ type: String, trim: true, default: '' })
  avatar: string;

  @Prop({ type: String, enum: ['normal', 'vip'], default: 'normal' })
  level: 'normal' | 'vip';

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
