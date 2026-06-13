import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../log/services/operation-log.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly operationLogService: OperationLogService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions', 'clinic'],
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return user;
  }

  async login(username: string, password: string, ip?: string, userAgent?: string) {
    const user = await this.validateUser(username, password);

    const roles = user.roles?.map(r => r.name) || [];
    const permissions = this.extractPermissions(user.roles);

    const payload: CurrentUserPayload = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      clinicId: user.clinicId,
      roles,
      permissions,
    };

    const token = this.jwtService.sign(payload);

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    await this.operationLogService.createLog({
      module: '用户权限',
      action: '登录',
      user: payload,
      ip,
      userAgent,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        clinicId: user.clinicId,
        clinic: user.clinic,
        roles,
        permissions,
      },
    };
  }

  async getCurrentUserInfo(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'clinic'],
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const roles = user.roles?.map(r => r.name) || [];
    const permissions = this.extractPermissions(user.roles);

    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      phone: user.phone,
      email: user.email,
      clinicId: user.clinicId,
      clinic: user.clinic,
      roles,
      permissions,
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('新密码长度不能少于6位');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: '密码修改成功' };
  }

  private extractPermissions(roles: Role[] | undefined): string[] {
    if (!roles) return [];
    const permissionSet = new Set<string>();
    roles.forEach(role => {
      role.permissions?.forEach(perm => {
        permissionSet.add(perm.code);
      });
    });
    return Array.from(permissionSet);
  }
}
