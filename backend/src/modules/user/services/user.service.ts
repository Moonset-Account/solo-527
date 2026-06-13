import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../log/services/operation-log.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly operationLogService: OperationLogService,
  ) {}

  async create(params: {
    username: string;
    password: string;
    realName: string;
    phone?: string;
    email?: string;
    clinicId: string;
    roleIds: string[];
  }, operator: CurrentUserPayload) {
    const existingUser = await this.userRepository.findOne({
      where: { username: params.username },
    });
    if (existingUser) {
      throw new BadRequestException('用户名已存在');
    }

    const roles = await this.roleRepository.find({
      where: { id: In(params.roleIds) },
    });

    const user = this.userRepository.create({
      username: params.username,
      passwordHash: await bcrypt.hash(params.password, 10),
      realName: params.realName,
      phone: params.phone,
      email: params.email,
      clinicId: params.clinicId,
      roles,
    });

    const savedUser = await this.userRepository.save(user);

    await this.operationLogService.createLog({
      module: '用户权限',
      action: '创建用户',
      targetType: 'User',
      targetId: savedUser.id,
      newValue: { username: params.username, realName: params.realName },
      user: operator,
    });

    return savedUser;
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    clinicId?: string;
    keyword?: string;
    isActive?: boolean;
  }) {
    const { page = 1, pageSize = 20, ...filters } = params;
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.clinic', 'clinic');

    if (filters.clinicId) {
      queryBuilder.andWhere('user.clinic_id = :clinicId', { clinicId: filters.clinicId });
    }
    if (filters.keyword) {
      queryBuilder.andWhere(
        '(user.username LIKE :keyword OR user.real_name LIKE :keyword OR user.phone LIKE :keyword)',
        { keyword: `%${filters.keyword}%` },
      );
    }
    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('user.is_active = :isActive', { isActive: filters.isActive });
    }

    const [items, total] = await queryBuilder
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map(u => this.sanitizeUser(u)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'clinic'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return this.sanitizeUser(user);
  }

  async update(id: string, params: {
    realName?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
    roleIds?: string[];
  }, operator: CurrentUserPayload) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const oldValue = { realName: user.realName, phone: user.phone, isActive: user.isActive };

    if (params.realName !== undefined) user.realName = params.realName;
    if (params.phone !== undefined) user.phone = params.phone;
    if (params.email !== undefined) user.email = params.email;
    if (params.isActive !== undefined) user.isActive = params.isActive;

    if (params.roleIds) {
      const roles = await this.roleRepository.find({
        where: { id: In(params.roleIds) },
      });
      user.roles = roles;
    }

    const savedUser = await this.userRepository.save(user);

    await this.operationLogService.createLog({
      module: '用户权限',
      action: '更新用户',
      targetType: 'User',
      targetId: id,
      oldValue,
      newValue: params,
      user: operator,
    });

    return this.sanitizeUser(savedUser);
  }

  async findAllRoles() {
    return await this.roleRepository.find({
      relations: ['permissions'],
      order: { createdAt: 'ASC' },
    });
  }

  async findAllPermissions() {
    return await this.permissionRepository.find({
      order: { module: 'ASC', code: 'ASC' },
    });
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...result } = user;
    return result;
  }
}
