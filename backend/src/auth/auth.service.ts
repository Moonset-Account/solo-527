import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误，或账号已被停用');
    }
    return user;
  }

  async login(user: User) {
    await this.usersService.updateLastLogin(user._id);
    const payload = {
      username: user.username,
      sub: user._id,
      role: user.role,
      realName: user.realName,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        realName: user.realName,
        role: user.role,
        status: user.status,
        phone: user.phone,
      },
    };
  }

  async getProfile(user: User) {
    return this.usersService.findOne(user._id);
  }
}
