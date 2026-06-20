import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto/user.dto';
import { UserRole, UserStatus } from '../../common/enums/user.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto, operatorId: string) {
    const existing = await this.usersRepository.findOne({
      where: [{ username: dto.username }, dto.email ? { email: dto.email } : {} as any],
    });
    if (existing) throw new ConflictException('用户名或邮箱已存在');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      username: dto.username,
      password: hashedPassword,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role || UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      settlementRatio: dto.settlementRatio ?? (dto.role === UserRole.PHOTOGRAPHER ? 0.7 : 0),
      createdBy: operatorId,
    });

    return this.usersRepository.save(user);
  }

  async findAll(query: QueryUsersDto) {
    const { role, status, keyword, page, pageSize } = query;
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 20;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const [list, total] = await this.usersRepository.findAndCount({
      where: keyword
        ? [
            { ...where, name: Like(`%${keyword}%`) },
            { ...where, username: Like(`%${keyword}%`) },
          ]
        : where,
      skip: (p - 1) * ps,
      take: ps,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page: p, pageSize: ps };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async findPhotographers() {
    return this.usersRepository.find({
      where: { role: UserRole.PHOTOGRAPHER },
      select: ['id', 'name', 'avatarUrl', 'settlementRatio'],
      order: { name: 'ASC' },
    });
  }

  async findBloggers() {
    return this.usersRepository.find({
      where: { role: UserRole.BLOGGER },
      select: ['id', 'name', 'avatarUrl'],
      order: { name: 'ASC' },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, operatorId: string) {
    const user = await this.findOne(id);
    if (updateUserDto.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('邮箱已被使用');
      }
    }
    if (updateUserDto.password) {
      (updateUserDto as any).password = await bcrypt.hash(updateUserDto.password, 10);
    }
    Object.assign(user, updateUserDto, { updatedBy: operatorId });
    return this.usersRepository.save(user);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.usersRepository.delete(id);
    return { success: true };
  }
}
