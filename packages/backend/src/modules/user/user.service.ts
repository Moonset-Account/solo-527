import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ where: { isActive: true } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role, isActive: true } });
  }

  async create(data: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);
    const user = this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    user.isActive = false;
    await this.userRepository.save(user);
  }

  async initAdminUser(): Promise<void> {
    const adminExists = await this.userRepository.findOne({ where: { role: UserRole.ADMIN } });
    if (!adminExists) {
      await this.create({
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        email: 'admin@travel.com',
        role: UserRole.ADMIN,
      });
      console.log('Admin user created: admin/admin123');
    }
  }
}
