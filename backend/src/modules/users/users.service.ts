import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto, LoginDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user._id,
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async register(createUserDto: CreateUserDto): Promise<{ user: User; token: string }> {
    const existingUser = await this.userModel.findOne({
      $or: [{ username: createUserDto.username }, { email: createUserDto.email }],
    });
    if (existingUser) {
      throw new BadRequestException('用户名或邮箱已存在');
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    await user.save();
    const token = await this.generateToken(user);
    return { user, token };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const user = await this.userModel.findOne({ username: loginDto.username });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const valid = await this.comparePassword(loginDto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const token = await this.generateToken(user);
    return { user, token };
  }

  async findAll(paginationDto: PaginationDto, filters?: { role?: string }): Promise<PaginatedResult<User>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const query: any = {};
    if (filters?.role) {
      query.role = filters.role;
    }
    const total = await this.userModel.countDocuments(query);
    const list = await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updateData: any = { ...updateUserDto };
    if (updateUserDto.password) {
      updateData.password = await this.hashPassword(updateUserDto.password);
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('用户不存在');
    }
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.userModel.find({ _id: { $in: ids.map(id => new Types.ObjectId(id)) } }).exec();
  }
}
