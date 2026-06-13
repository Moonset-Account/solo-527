import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { username: createUserDto.username, deleted: false },
    });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async findAll(query?: QueryUserDto): Promise<User[]> {
    const where: any = { deleted: false };
    if (query?.role) where.role = query.role;
    if (query?.shift) where.shift = query.shift;
    if (query?.gridArea) where.gridArea = query.gridArea;
    if (query?.isVotingEligible !== undefined) where.isVotingEligible = query.isVotingEligible;

    return this.userRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, deleted: false },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({
      where: { username, deleted: false },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.deleted = true;
    await this.userRepository.save(user);
  }

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new BadRequestException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('用户名或密码错误');
    }

    return user;
  }
}
