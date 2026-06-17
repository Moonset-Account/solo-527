import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, LoginResponse, InitAdminDto } from './dto/auth.dto';
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

  private readonly ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER];

  private validateRolesAssignment(targetRoles: string[], operatorRoles: string[]): void {
    const operatorIsSuperAdmin = operatorRoles?.includes(UserRole.SUPER_ADMIN);
    const requestedAdminRoles = targetRoles?.filter((r) => this.ADMIN_ROLES.includes(r as UserRole)) || [];

    if (requestedAdminRoles.length > 0 && !operatorIsSuperAdmin) {
      throw new ForbiddenException('只有超级管理员可以授予管理员角色');
    }

    if (requestedAdminRoles.includes(UserRole.SUPER_ADMIN) && !operatorIsSuperAdmin) {
      throw new ForbiddenException('只有超级管理员可以创建超级管理员');
    }
  }

  async initAdmin(dto: InitAdminDto): Promise<any> {
    const seedToken = this.configService.get<string>('security.seedToken') || process.env.SEED_TOKEN;
    if (dto.seedToken !== seedToken) {
      throw new BadRequestException('SEED_TOKEN 验证失败');
    }

    const hasAnyUser = await this.usersService.hasAnyUser();
    if (hasAnyUser) {
      throw new ForbiddenException('系统已有用户，初始化入口已关闭');
    }

    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('密码长度至少6位');
    }

    const user = await this.usersService.create(
      {
        username: dto.username,
        password: dto.password,
        realName: dto.realName,
        email: dto.email,
        phone: dto.phone,
        department: dto.department,
        position: dto.position,
        laboratory: dto.laboratory,
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
        isActive: true,
      },
      'seed',
    );

    return { id: user._id, username: user.username, realName: user.realName, roles: user.roles };
  }

  async register(dto: RegisterDto, operatorId: string, operatorRoles: string[]): Promise<any> {
    if (!operatorId) {
      throw new ForbiddenException('请先登录');
    }

    const existing = await this.usersService.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const effectiveRoles = dto.roles?.length ? dto.roles : [UserRole.USER, UserRole.RESEARCHER];
    this.validateRolesAssignment(effectiveRoles, operatorRoles);

    const user = await this.usersService.create(
      {
        ...dto,
        roles: effectiveRoles,
        isActive: true,
      },
      operatorId,
    );

    return { id: user._id, username: user.username, realName: user.realName, roles: user.roles };
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
