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
    const futureExpireDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const pastExpireDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return this.userModel
      .find({
        status: 'active',
        permissionExpireAt: { $gte: pastExpireDate, $lte: futureExpireDate },
      })
      .sort({ permissionExpireAt: 1 })
      .select('name email phone department permissionExpireAt role username');
  }

  async findOperatorOwners() {
    return this.userModel
      .find({ isOperatorOwner: true, status: 'active' })
      .select('name email phone department');
  }

  async initDefaultUsers() {
    const now = new Date();
    const freshDates = {
      manager: new Date(now.getTime() + 30 * 86400000),
      operator: new Date(now.getTime() + 7 * 86400000),
      viewer: new Date(now.getTime() - 2 * 86400000),
    };

    const defaultUserSpecs = [
      {
        username: 'admin',
        name: '超级管理员',
        email: 'admin@example.com',
        role: 'admin' as const,
        department: '技术部',
      },
      {
        username: 'manager',
        name: '运营经理',
        email: 'manager@example.com',
        role: 'manager' as const,
        department: '运营部',
        isOperatorOwner: true,
        permissionExpireAt: freshDates.manager,
      },
      {
        username: 'operator',
        name: '运营专员',
        email: 'operator@example.com',
        role: 'operator' as const,
        department: '运营部',
        permissionExpireAt: freshDates.operator,
      },
      {
        username: 'viewer',
        name: '数据查看员',
        email: 'viewer@example.com',
        role: 'viewer' as const,
        department: '产品部',
        permissionExpireAt: freshDates.viewer,
      },
    ];

    let updatedCount = 0;
    let createdCount = 0;

    for (const spec of defaultUserSpecs) {
      const existing = await this.userModel.findOne({ username: spec.username });
      if (existing) {
        const needsRefresh =
          (spec.permissionExpireAt &&
            existing.permissionExpireAt &&
            Math.abs(
              new Date(spec.permissionExpireAt).getTime() -
                new Date(existing.permissionExpireAt).getTime(),
            ) > 86400000) ||
          (!existing.permissionExpireAt && spec.permissionExpireAt) ||
          (existing.isOperatorOwner !== spec.isOperatorOwner) ||
          existing.status !== 'active';

        if (needsRefresh) {
          await this.userModel.updateOne(
            { username: spec.username },
            {
              $set: {
                permissionExpireAt: spec.permissionExpireAt,
                isOperatorOwner: spec.isOperatorOwner,
                status: 'active',
              },
            },
          );
          updatedCount++;
        }
      } else {
        const hashedPwd = await bcrypt.hash(`${spec.username}123`, 10);
        await this.userModel.create({
          ...spec,
          password: hashedPwd,
          status: 'active',
        });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      console.log(`✅ 新增 ${createdCount} 个默认用户`);
    }
    if (updatedCount > 0) {
      console.log(`🔄 刷新 ${updatedCount} 个默认用户的权限日期`);
    }
    if (createdCount === 0 && updatedCount === 0) {
      console.log('✅ 默认用户权限日期已处于最新状态');
    }
  }
}
