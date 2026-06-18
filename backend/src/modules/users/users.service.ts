import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({ username: createUserDto.username });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return user.save();
  }

  async findAll(query: QueryUsersDto) {
    const { keyword, role, status, page = 1, pageSize = 20 } = query;
    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const total = await this.userModel.countDocuments(filter);
    const list = await this.userModel
      .find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
  }

  async updateLoginInfo(id: string, ip: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async findExpiringUsers(days: number = 7) {
    const now = new Date();
    const expireDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.userModel
      .find({
        status: 'active',
        permissionExpireAt: { $gte: now, $lte: expireDate },
      })
      .select('name email phone department permissionExpireAt role');
  }

  async findOperatorOwners() {
    return this.userModel
      .find({ isOperatorOwner: true, status: 'active' })
      .select('name email phone department');
  }

  async initDefaultUsers() {
    const count = await this.userModel.countDocuments();
    if (count > 0) return;

    const defaultUsers = [
      {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        name: '超级管理员',
        email: 'admin@example.com',
        role: 'admin',
        department: '技术部',
      },
      {
        username: 'manager',
        password: await bcrypt.hash('manager123', 10),
        name: '运营经理',
        email: 'manager@example.com',
        role: 'manager',
        department: '运营部',
        isOperatorOwner: true,
        permissionExpireAt: new Date('2025-12-31'),
      },
      {
        username: 'operator',
        password: await bcrypt.hash('operator123', 10),
        name: '运营专员',
        email: 'operator@example.com',
        role: 'operator',
        department: '运营部',
        permissionExpireAt: new Date('2025-06-30'),
      },
      {
        username: 'viewer',
        password: await bcrypt.hash('viewer123', 10),
        name: '数据查看员',
        email: 'viewer@example.com',
        role: 'viewer',
        department: '产品部',
        permissionExpireAt: new Date('2025-03-31'),
      },
    ];

    await this.userModel.insertMany(defaultUsers);
    console.log('✅ 默认用户初始化完成');
  }
}
