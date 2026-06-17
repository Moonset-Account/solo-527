import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(username: string, password: string): Promise<any> {
    const admin = await this.prisma.admin.findUnique({ where: { username } });
    if (!admin || !admin.isActive) throw new UnauthorizedException('账号不存在或已禁用');
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) throw new UnauthorizedException('密码错误');
    return admin;
  }

  async login(admin: any) {
    const payload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
      name: admin.name,
      type: 'admin',
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      }),
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const payload = { sub: decoded.sub, username: decoded.username, role: decoded.role, name: decoded.name, type: decoded.type };
      return { accessToken: this.jwtService.sign(payload) };
    } catch (e) {
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }
  }

  getProfile(adminId: string) {
    return this.prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
    });
  }
}
