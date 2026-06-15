import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserModel } from '../../schemas/user.schema.js';
import { DepartmentModel } from '../../schemas/department.schema.js';
import type { IUser, UserRole, UserStatus } from '../../common/types/index.js';

interface FindAllQuery {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  keyword?: string;
  status?: UserStatus;
}

@Injectable()
export class UserService {
  async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async create(
    username: string,
    password: string,
    name: string,
    role: UserRole,
    department: string,
    status: UserStatus = 'active',
  ): Promise<IUser> {
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await this.hashPassword(password);

    const user = new UserModel({
      username,
      password: hashedPassword,
      name,
      role,
      department: new Types.ObjectId(department),
      status,
    });

    return await user.save();
  }

  async findAll(query: FindAllQuery) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const filter: any = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.keyword) {
      filter.$or = [
        { username: { $regex: query.keyword, $options: 'i' } },
        { name: { $regex: query.keyword, $options: 'i' } },
      ];
    }

    const [list, total] = await Promise.all([
      UserModel.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('department', 'name'),
      UserModel.countDocuments(filter),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('用户不存在');
    }
    const user = await UserModel.findById(id).populate('department', 'name');
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByUsername(username: string) {
    return await UserModel.findOne({ username }).populate('department', 'name');
  }

  async update(id: string, data: { name?: string; role?: UserRole; department?: string; status?: UserStatus }) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('用户不存在');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.department !== undefined) updateData.department = new Types.ObjectId(data.department as unknown as string);
    if (data.status !== undefined) updateData.status = data.status;

    const user = await UserModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('用户不存在');
    }

    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return { message: '删除成功' };
  }

  async initDefaultAdmin() {
    const existingAdmin = await UserModel.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('默认管理员已存在，跳过初始化');
      return;
    }

    console.log('开始初始化默认管理员...');

    let defaultDept = await DepartmentModel.findOne({ name: '默认部门' });

    if (!defaultDept) {
      const tempHeadId = new Types.ObjectId();
      defaultDept = new DepartmentModel({
        name: '默认部门',
        head: tempHeadId,
      });
      await defaultDept.save();
    }

    const hashedPassword = await this.hashPassword('admin123');

    const admin = new UserModel({
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'admin',
      department: defaultDept._id,
      status: 'active',
    });

    await admin.save();

    if (defaultDept.head.toString() !== admin._id.toString()) {
      defaultDept.head = admin._id;
      await defaultDept.save();
    }

    console.log('默认管理员创建成功: admin/admin123');
  }
}
