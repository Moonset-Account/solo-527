import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, LoginResponse } from './dto/auth.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, UserRole } from '@/common/enums/index.enum';
import { RedisService } from '@/common/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<any> {
    const existing = await this.usersService.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('用户名已存在');
    }
    const user = await this.usersService.create({
      ...dto,
      roles: dto.roles || [UserRole.USER],
      isActive: true,
    });
    return { id: user._id, username: user.username, realName: user.realName };
  }

  async login(loginDto: LoginDto, ip?: string): Promise<LoginResponse> {
    const user = await this.usersService.findByUsername(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('用户已被禁用，请联系管理员');
    }

    const isValid = await this.usersService.validatePassword(user, loginDto.password);
    if (!isValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    await this.usersService.updateLoginInfo(user._id.toString(), ip);

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      roles: user.roles,
      realName: user.realName,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '24h';

    await this.redisService.set(`auth:token:${user._id}`, accessToken, 86400);

    await this.auditService.create({
      action: AuditAction.LOGIN,
      module: 'auth',
      targetId: user._id.toString(),
      targetName: user.username,
      operatorId: user._id.toString(),
      operatorName: user.realName,
      details: { ip },
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user._id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        department: user.department,
        laboratory: user.laboratory,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    await this.redisService.del(`auth:token:${userId}`);
    await this.auditService.create({
      action: AuditAction.LOGOUT,
      module: 'auth',
      targetId: userId,
      targetName: userId,
      operatorId: userId,
      operatorName: userId,
    });
  }
}
