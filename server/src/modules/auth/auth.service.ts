import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { IUser } from '../../common/types/index.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status === 'disabled') {
      throw new UnauthorizedException('用户已被禁用');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      roles: [user.role],
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    await this.redisService.set(
      `refresh_token:${user._id}`,
      refreshToken,
      7 * 24 * 60 * 60,
    );

    const { password: _, ...userWithoutPassword } = user.toObject
      ? user.toObject()
      : user;

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: userWithoutPassword as Omit<IUser, 'password'>,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      });

      const storedToken = await this.redisService.get(
        `refresh_token:${payload.sub}`,
      );
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      const user = await this.userService.findById(payload.sub);
      if (!user || user.status === 'disabled') {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }

      const newPayload = {
        sub: user._id.toString(),
        username: user.username,
        roles: [user.role],
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      });

      await this.redisService.set(
        `refresh_token:${user._id}`,
        newRefreshToken,
        7 * 24 * 60 * 60,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const { password: _, ...userWithoutPassword } = user.toObject
      ? user.toObject()
      : user;

    return userWithoutPassword as Omit<IUser, 'password'>;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
