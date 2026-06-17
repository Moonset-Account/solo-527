import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, QueryUsersDto } from './dto/user.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@/common/enums/index.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private auditService: AuditService,
  ) {}

  async create(createUserDto: CreateUserDto, operatorId?: string): Promise<User> {
    const existing = await this.userModel.findOne({
      $or: [
        { username: createUserDto.username },
        ...(createUserDto.email ? [{ email: createUserDto.email }] : []),
        ...(createUserDto.phone ? [{ phone: createUserDto.phone }] : []),
      ],
    });
    if (existing) {
      throw new ConflictException('用户名、邮箱或手机号已存在');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      audit: { createdBy: operatorId, updatedBy: operatorId },
    });

    await user.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'users',
      targetId: user._id.toString(),
      targetName: user.username,
      operatorId,
      operatorName: operatorId ? (await this.findById(operatorId))?.realName : 'system',
      details: createUserDto,
    });

    return this.sanitizeUser(user);
  }

  async findAll(query: QueryUsersDto): Promise<{ list: User[]; total: number }> {
    const { keyword, department, role, page, pageSize } = query;
    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { realName: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (department) filter.department = department;
    if (role) filter.roles = { $in: [role] };

    const [list, total] = await Promise.all([
      this.userModel
        .find(filter)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .select('-password')
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return { list: list.map((u) => this.sanitizeUser(u)), total };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) throw new NotFoundException('用户不存在');
    return this.sanitizeUser(user);
  }

  async findByUsername(username: string): Promise<UserDocument> {
    return this.userModel.findOne({ username }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto, operatorId?: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('用户不存在');

    Object.assign(user, updateUserDto, {
      audit: { ...user.audit, updatedBy: operatorId, updatedAt: new Date() },
    });
    await user.save();

    await this.auditService.create({
      action: AuditAction.UPDATE,
      module: 'users',
      targetId: id,
      targetName: user.username,
      operatorId,
      operatorName: operatorId ? (await this.findById(operatorId))?.realName : 'system',
      details: updateUserDto,
    });

    return this.sanitizeUser(user);
  }

  async remove(id: string, operatorId?: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('用户不存在');

    user.isActive = false;
    user.audit = { ...user.audit, updatedBy: operatorId, updatedAt: new Date() };
    await user.save();

    await this.auditService.create({
      action: AuditAction.DELETE,
      module: 'users',
      targetId: id,
      targetName: user.username,
      operatorId,
      operatorName: operatorId ? (await this.findById(operatorId))?.realName : 'system',
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto, operatorId?: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('用户不存在');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('原密码错误');

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.audit = { ...user.audit, updatedBy: operatorId || id, updatedAt: new Date() };
    await user.save();
  }

  async updateLoginInfo(id: string, ip: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async validatePassword(user: UserDocument, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  private sanitizeUser(user: UserDocument): User {
    const obj = user.toObject ? user.toObject() : user;
    delete (obj as any).password;
    return obj as User;
  }
}
