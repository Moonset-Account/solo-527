import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './user.schema.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const created = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return created.save();
  }

  async findAll(): Promise<(User & { _id: Types.ObjectId })[]> {
    return this.userModel.find().select('-password').lean() as any;
  }

  async findById(id: string): Promise<User & { _id: Types.ObjectId }> {
    const user = await this.userModel.findById(id).select('-password').lean();
    if (!user) throw new NotFoundException('用户不存在');
    return user as any;
  }

  async findByUsername(username: string): Promise<(User & { _id: Types.ObjectId }) | null> {
    return this.userModel.findOne({ username }).lean() as any;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User & { _id: Types.ObjectId }> {
    const updateData: any = { ...updateUserDto };
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const updated = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .lean();
    if (!updated) throw new NotFoundException('用户不存在');
    return updated as any;
  }

  async delete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('用户不存在');
  }
}
