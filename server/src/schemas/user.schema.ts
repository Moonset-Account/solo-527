import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
}

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: '用户ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: '用户名' })
  @Prop({ required: true, unique: true })
  username: string;

  @ApiProperty({ description: '密码' })
  @Prop({ required: true })
  password: string;

  @ApiProperty({ description: '姓名' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: '角色', enum: UserRole })
  @Prop({ required: true, enum: UserRole, default: UserRole.STAFF })
  role: UserRole;

  @ApiProperty({ description: '手机号' })
  @Prop()
  phone: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
