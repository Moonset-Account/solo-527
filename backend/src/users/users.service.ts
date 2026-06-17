import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './user.schema';
import { CreateUserDto, UpdateUserDto, UpdateStatusDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto, createdBy: Types.ObjectId): Promise<User> {
    const existingUser = await this.userModel.findOne({
      $or: [{ username: createUserDto.username }, { email: createUserDto.email }],
    });
    if (existingUser) {
      throw new ConflictException('用户名或邮箱已存在');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      createdBy,
      updatedBy: createdBy,
    });
    return user.save();
  }

  async findAll(query: { page?: number; limit?: number; role?: string; status?: string } = {}): Promise<{ data: User[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    
    const [data, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit).select('-password').populate('createdBy', 'realName username').exec(),
      this.userModel.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').populate('createdBy updatedBy', 'realName username');
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    return this.userModel.findOne({ username });
  }

  async update(id: string, updateUserDto: UpdateUserDto, updatedBy: Types.ObjectId): Promise<User> {
    const updateData: any = { ...updateUserDto, updatedBy };
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const user = await this.userModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, updatedBy: Types.ObjectId): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { status: dto.status, updatedBy },
      { new: true },
    ).select('-password');
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('用户不存在');
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (user && user.status === UserStatus.ACTIVE && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }
}
