import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../entities/user.entity';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';

export interface CreateUserDto {
  username: string;
  password: string;
  name: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export interface QueryUsersDto {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  keyword?: string;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OperationLog)
    private operationLogsRepository: Repository<OperationLog>,
  ) {}

  async findAll(query: QueryUsersDto) {
    const { page = 1, pageSize = 10, role, keyword, isActive } = query;
    const where: any = {};

    if (role) {
      where.role = role;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (keyword) {
      where.name = ILike(`%${keyword}%`);
    }

    const [data, total] = await this.usersRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async create(dto: CreateUserDto, operator: User) {
    const existing = await this.usersRepository.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      ...dto,
      password: hashedPassword,
      role: dto.role || UserRole.CUSTOMER,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });
    const saved = await this.usersRepository.save(user);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'users',
      operationType: OperationType.CREATE,
      targetId: saved.id,
      description: `创建用户: ${saved.username}`,
      afterData: {
        id: saved.id,
        username: saved.username,
        name: saved.name,
        role: saved.role,
      },
    });

    const { password, ...result } = saved;
    return result;
  }

  async update(id: string, dto: UpdateUserDto, operator: User) {
    const user = await this.findOne(id);
    const beforeData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };

    const updateData: any = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    await this.usersRepository.update(id, updateData);
    const updated = await this.findOne(id);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'users',
      operationType: OperationType.UPDATE,
      targetId: id,
      description: `更新用户: ${user.username}`,
      beforeData,
      afterData: {
        id: updated.id,
        username: updated.username,
        name: updated.name,
        role: updated.role,
        isActive: updated.isActive,
      },
    });

    const { password, ...result } = updated;
    return result;
  }

  async remove(id: string, operator: User) {
    const user = await this.findOne(id);
    await this.usersRepository.delete(id);

    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'users',
      operationType: OperationType.DELETE,
      targetId: id,
      description: `删除用户: ${user.username}`,
      beforeData: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
    });

    return { success: true };
  }
}
