import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { User, UserDocument } from '../../schemas/user.schema';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '../../dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private validatePhone(phone: string) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
  }

  private clearUserRelatedCache(): void {
    this.cacheManager.store.keys('users:*').then((keys: string[]) => {
      keys.forEach((key: string) => {
        this.cacheManager.del(key);
      });
    });
  }

  async create(createUserDto: CreateUserDto): Promise<{ data: User; message?: string }> {
    if (!createUserDto.name || !createUserDto.name.trim()) {
      throw new BadRequestException('姓名不能为空');
    }
    if (!createUserDto.phone) {
      throw new BadRequestException('手机号不能为空');
    }
    this.validatePhone(createUserDto.phone);

    const existing = await this.userModel.findOne({ phone: createUserDto.phone }).exec();
    if (existing) {
      return {
        data: existing,
        message: '用户已存在，直接返回',
      };
    }

    const data: any = {
      ...createUserDto,
      level: createUserDto.level || 'normal',
    };

    const createdUser = new this.userModel(data);
    const saved = await createdUser.save();
    this.clearUserRelatedCache();
    return { data: saved };
  }

  async findAll(query: QueryUserDto): Promise<{ data: User[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 10, limit, keyword } = query;
    const actualPageSize = pageSize || limit || 10;
    const filter: any = {};

    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      filter.$or = [
        { name: regex },
        { phone: regex },
      ];
    }

    const skip = (page - 1) * actualPageSize;
    const [data, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(actualPageSize).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, pageSize: actualPageSize };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User> {
    this.validatePhone(phone);
    const user = await this.userModel.findOne({ phone }).exec();
    if (!user) {
      throw new NotFoundException(`手机号 ${phone} 对应用户不存在`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existing = await this.userModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }

    if (updateUserDto.phone !== undefined) {
      this.validatePhone(updateUserDto.phone);
      const phoneExists = await this.userModel
        .findOne({ phone: updateUserDto.phone, _id: { $ne: id } })
        .exec();
      if (phoneExists) {
        throw new BadRequestException('手机号已被其他用户使用');
      }
    }
    if (updateUserDto.name !== undefined && !updateUserDto.name.trim()) {
      throw new BadRequestException('姓名不能为空');
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true, runValidators: true })
      .exec();
    this.clearUserRelatedCache();
    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
    this.clearUserRelatedCache();
    return deletedUser;
  }
}
