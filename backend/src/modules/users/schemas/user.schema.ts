import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../common/enums/index.enum';
import { AuditInfo, AuditInfoSchema } from '../../common/schemas/audit-info.schema';

export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  username: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true })
  realName: string;

  @Prop({ type: String, unique: true, sparse: true })
  email: string;

  @Prop({ type: String, unique: true, sparse: true })
  phone: string;

  @Prop({ type: String })
  department: string;

  @Prop({ type: String })
  laboratory: string;

  @Prop({ type: String })
  position: string;

  @Prop({ type: [String], enum: Object.values(UserRole), default: [UserRole.USER] })
  roles: UserRole[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String })
  avatar: string;

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop({ type: String })
  lastLoginIp: string;

  @Prop({ type: AuditInfoSchema, default: () => new AuditInfo() })
  audit: AuditInfo;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ username: 1 });
UserSchema.index({ department: 1 });
