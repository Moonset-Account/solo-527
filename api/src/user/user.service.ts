import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { TargetType } from '../../../shared/types.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async findAll(query: {
    keyword?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { keyword, role, page = 1, pageSize = 10 } = query;
    const qb = this.userRepository.createQueryBuilder('user');

    if (keyword) {
      qb.andWhere(
        '(user.username LIKE :keyword OR user.display_name LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (role) {
      qb.andWhere('user.role = :role', { role });
    }

    qb.orderBy('user.created_at', 'DESC');
    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(createUserDto: CreateUserDto, operatorId?: number) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const saved = await this.userRepository.save(user);
    const { password: _, ...afterData } = saved;
    await this.auditService.log(
      operatorId,
      'create_user',
      TargetType.user,
      saved.id,
      null,
      afterData as unknown as Record<string, unknown>,
    );
    return saved;
  }

  async update(id: number, updateUserDto: UpdateUserDto, operatorId?: number) {
    const before = await this.userRepository.findOne({ where: { id } });
    if (!before) return null;
    await this.userRepository.update(id, updateUserDto);
    const after = await this.userRepository.findOne({ where: { id } });
    const { password: _b, ...beforeData } = before;
    const { password: _a, ...afterData } = after!;
    await this.auditService.log(
      operatorId,
      'update_user',
      TargetType.user,
      id,
      beforeData as unknown as Record<string, unknown>,
      afterData as unknown as Record<string, unknown>,
    );
    return after;
  }

  async remove(id: number, operatorId?: number) {
    const before = await this.userRepository.findOne({ where: { id } });
    if (!before) return null;
    const { password: _, ...beforeData } = before;
    await this.auditService.log(
      operatorId,
      'delete_user',
      TargetType.user,
      id,
      beforeData as unknown as Record<string, unknown>,
      null,
    );
    return this.userRepository.delete(id);
  }
}
