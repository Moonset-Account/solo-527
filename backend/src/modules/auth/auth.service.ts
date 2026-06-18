import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && user.status !== 'active') {
      throw new UnauthorizedException('账号已被禁用或已过期');
    }
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto, ip: string) {
    const { username, password } = loginDto;
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = {
      sub: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      department: user.department,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.configService.get('JWT_SECRET') + '_refresh',
    });

    await this.redis.set(
      `refresh_token:${user._id}`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60,
    );

    await this.usersService.updateLoginInfo(user._id, ip);

    const permissionWarning = this.checkPermissionExpiry(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        department: user.department,
        status: user.status,
        permissionExpireAt: user.permissionExpireAt,
        permissionWarning,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET') + '_refresh',
      });

      const storedToken = await this.redis.get(`refresh_token:${payload.sub}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Refresh Token 无效');
      }

      const newPayload = {
        sub: payload.sub,
        username: payload.username,
        name: payload.name,
        role: payload.role,
        email: payload.email,
        department: payload.department,
      };

      const accessToken = this.jwtService.sign(newPayload);
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh Token 已过期或无效');
    }
  }

  async logout(userId: string) {
    await this.redis.del(`refresh_token:${userId}`);
    return { message: '退出成功' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findOne(userId);
    const userWithPassword = await this.usersService['userModel'].findById(userId);

    const isOldValid = await bcrypt.compare(
      dto.oldPassword,
      userWithPassword.password,
    );
    if (!isOldValid) {
      throw new BadRequestException('原密码错误');
    }

    const newHashed = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService['userModel'].findByIdAndUpdate(userId, {
      password: newHashed,
    });

    await this.logout(userId);
    return { message: '密码修改成功，请重新登录' };
  }

  private checkPermissionExpiry(user: any) {
    if (!user.permissionExpireAt) return null;

    const now = new Date();
    const expireAt = new Date(user.permissionExpireAt);
    const diffDays = Math.ceil(
      (expireAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays <= 0) {
      return {
        expired: true,
        daysLeft: diffDays,
        message: '您的账号权限已过期，部分功能可能受限，请联系运营负责人续期',
      };
    } else if (diffDays <= 7) {
      return {
        expired: false,
        daysLeft: diffDays,
        message: `您的账号权限将在 ${diffDays} 天后过期，请及时续期`,
      };
    }
    return null;
  }
}
