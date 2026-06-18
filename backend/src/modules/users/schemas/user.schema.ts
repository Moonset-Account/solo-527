import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';
export type UserStatus = 'active' | 'disabled' | 'expired';

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, sparse: true })
  email: string;

  @Prop()
  phone: string;

  @Prop({
    type: String,
    enum: ['admin', 'manager', 'operator', 'viewer'],
    default: 'viewer',
  })
  role: UserRole;

  @Prop({
    type: String,
    enum: ['active', 'disabled', 'expired'],
    default: 'active',
  })
  status: UserStatus;

  @Prop()
  department: string;

  @Prop({ type: Date })
  permissionExpireAt: Date;

  @Prop({ default: false })
  isOperatorOwner: boolean;

  @Prop()
  avatar: string;

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop()
  lastLoginIp: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
