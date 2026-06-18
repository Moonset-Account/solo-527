import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../entities/user.entity';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OperationLog)
    private operationLogsRepository: Repository<OperationLog>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (user && user.isActive && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, ipAddress?: string, userAgent?: string) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    
    await this.operationLogsRepository.save({
      operatorId: user.id,
      module: 'auth',
      operationType: OperationType.LOGIN,
      description: `用户 ${user.username} 登录系统`,
      ipAddress,
      userAgent,
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
      },
    };
  }

  async register(registerDto: any) {
    const existing = await this.usersRepository.findOne({ 
      where: { username: registerDto.username } 
    });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
      role: registerDto.role || UserRole.CUSTOMER,
    });
    const saved = (await this.usersRepository.save(user)) as unknown as User;

    await this.operationLogsRepository.save({
      module: 'auth',
      operationType: OperationType.CREATE,
      targetId: saved.id,
      description: `用户注册: ${saved.username}`,
    });

    return {
      id: saved.id,
      username: saved.username,
      name: saved.name,
      role: saved.role,
    };
  }

  async initDefaultUsers() {
    const adminExists = await this.usersRepository.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await this.usersRepository.save([
        {
          username: 'admin',
          password: hashedPassword,
          name: '系统管理员',
          role: UserRole.ADMIN,
          phone: '13800138000',
          email: 'admin@pet.com',
        },
        {
          username: 'manager',
          password: hashedPassword,
          name: '店长李经理',
          role: UserRole.MANAGER,
          phone: '13800138001',
          email: 'manager@pet.com',
        },
        {
          username: 'staff01',
          password: hashedPassword,
          name: '洗护师小王',
          role: UserRole.STAFF,
          phone: '13800138002',
          email: 'staff01@pet.com',
        },
        {
          username: 'volunteer01',
          password: hashedPassword,
          name: '志愿者小张',
          role: UserRole.VOLUNTEER,
          phone: '13800138003',
          email: 'volunteer01@pet.com',
        },
        {
          username: 'customer01',
          password: hashedPassword,
          name: '顾客陈女士',
          role: UserRole.CUSTOMER,
          phone: '13800138004',
          email: 'customer01@pet.com',
        },
      ]);
      console.log('默认用户已创建: admin/manager/staff01/volunteer01/customer01 (密码均为 admin123)');
    }
  }
}
