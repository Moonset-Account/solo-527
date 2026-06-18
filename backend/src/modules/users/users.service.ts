import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const adminExists = await this.usersRepository.findOne({
      where: { username: 'admin' },
    });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await this.usersRepository.save({
        username: 'admin',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        name: '系统管理员',
        isActive: true,
      });
    }

    const staffExists = await this.usersRepository.findOne({
      where: { username: 'staff' },
    });
    if (!staffExists) {
      const hashedPassword = await bcrypt.hash('staff123', 10);
      await this.usersRepository.save({
        username: 'staff',
        passwordHash: hashedPassword,
        role: UserRole.DUTY_STAFF,
        name: '值班人员',
        isActive: true,
      });
    }
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async create(user: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.passwordHash || '123456', 10);
    const newUser = this.usersRepository.create({
      ...user,
      passwordHash: hashedPassword,
    });
    return this.usersRepository.save(newUser);
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    if (user.passwordHash) {
      user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
    }
    await this.usersRepository.update(id, user);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
