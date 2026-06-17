import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, QueryUsersDto } from './dto/user.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, UserRole } from '@/common/enums/index.enum';

@Injectable()
export class UsersService {
  private readonly ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER];

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private auditService: AuditService,
  ) {}

  async hasAnyUser(): Promise<boolean> {
    const count = await this.userModel.countDocuments().exec();
    return count > 0;
  }

  private async validateRoles(
    targetRoles: string[],
    operatorId?: string,
  ): Promise<void> {
    if (!operatorId || operatorId === 'seed') return;

    const targetAdminRoles = targetRoles?.filter((r) => this.ADMIN_ROLES.includes(r as UserRole)) || [];
    if (targetAdminRoles.length === 0) return;

    const operator = await this.userModel.findById(operatorId).select('roles').exec();
    if (!operator) {
      throw new ForbiddenException('操作人不存在');
    }
    const operatorIsSuperAdmin = operator.roles?.includes(UserRole.SUPER_ADMIN);

    if (targetAdminRoles.length > 0 && !operatorIsSuperAdmin) {
      throw new ForbiddenException('只有超级管理员可以授予管理员角色');
    }
    if (targetAdminRoles.includes(UserRole.SUPER_ADMIN) && !operatorIsSuperAdmin) {
      throw new ForbiddenException('只有超级管理员可以创建超级管理员');
    }
  }

  async create(createUserDto: CreateUserDto, operatorId?: string): Promise<User> {
    await this.validateRoles(createUserDto.roles || [], operatorId);

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

    const operatorName = await this.safeGetOperatorName(operatorId);

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'users',
      targetId: user._id.toString(),
      targetName: user.username,
      operatorId,
      operatorName,
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

  private async safeGetOperatorName(operatorId?: string): Promise<string> {
    if (!operatorId) return 'system';
    if (operatorId === 'seed') return 'seed-initialization';
    if (!Types.ObjectId.isValid(operatorId)) return 'system';
    try {
      return (await this.findById(operatorId))?.realName || 'system';
    } catch {
      return 'system';
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, operatorId?: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('用户不存在');

    if (updateUserDto.roles) {
      await this.validateRoles(updateUserDto.roles, operatorId);
    }

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
      operatorName: await this.safeGetOperatorName(operatorId),
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
      operatorName: await this.safeGetOperatorName(operatorId),
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
