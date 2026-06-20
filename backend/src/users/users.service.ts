import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationType } from '../common/enums/operation-type.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private operationLogsService: OperationLogsService,
  ) {}

  async create(createUserDto: CreateUserDto, operatorId?: string): Promise<User> {
    const existingUser = await this.userModel.findOne({
      $or: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    if (operatorId) {
      await this.operationLogsService.create({
        userId: operatorId,
        operationType: OperationType.CREATE,
        module: 'users',
        targetId: savedUser._id.toString(),
        details: { name: savedUser.name, role: savedUser.role },
        ip: 'localhost',
      });
    }

    return savedUser;
  }

  async findAll(searchDto: SearchDto): Promise<PaginatedResult<User>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      keyword,
      status,
      ownerId,
    } = searchDto;

    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { username: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { department: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (status !== undefined) {
      filter.isActive = status === 'active';
    }

    if (ownerId) {
      filter._id = new Types.ObjectId(ownerId);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto, operatorId?: string): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true, runValidators: true })
      .exec();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (operatorId) {
      await this.operationLogsService.create({
        userId: operatorId,
        operationType: OperationType.UPDATE,
        module: 'users',
        targetId: id,
        details: { ...updateUserDto, password: undefined },
        ip: 'localhost',
      });
    }

    return user;
  }

  async remove(id: string, operatorId?: string): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id).exec();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (operatorId) {
      await this.operationLogsService.create({
        userId: operatorId,
        operationType: OperationType.DELETE,
        module: 'users',
        targetId: id,
        details: { name: user.name },
        ip: 'localhost',
      });
    }

    return user;
  }

  async findInterviewers(): Promise<User[]> {
    return this.userModel
      .find({ role: 'interviewer', isActive: true })
      .select('-password')
      .exec();
  }

  async initDefaultUsers() {
    const count = await this.userModel.countDocuments().exec();
    if (count > 0) return;

    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        name: '系统管理员',
        role: 'admin',
        department: '技术部',
        position: '技术总监',
      },
      {
        username: 'interviewer1',
        email: 'interviewer1@example.com',
        password: '123456',
        name: '张面试官',
        role: 'interviewer',
        department: '技术部',
        position: '高级工程师',
      },
      {
        username: 'interviewer2',
        email: 'interviewer2@example.com',
        password: '123456',
        name: '李面试官',
        role: 'interviewer',
        department: '技术部',
        position: '技术专家',
      },
      {
        username: 'hr1',
        email: 'hr1@example.com',
        password: '123456',
        name: '王HR',
        role: 'hr',
        department: '人力资源部',
        position: '招聘经理',
      },
    ];

    for (const user of defaultUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const newUser = new this.userModel({
        ...user,
        password: hashedPassword,
      });
      await newUser.save();
    }

    console.log('默认用户已初始化');
  }
}
