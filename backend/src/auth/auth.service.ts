import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationType } from '../common/enums/operation-type.enum';

@Injectable()
export class AuthService {
  constructor(
    @Inject('CONFIG') private config: any,
    private usersService: UsersService,
    private jwtService: JwtService,
    private operationLogsService: OperationLogsService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.config.jwt.secret,
      expiresIn: this.config.jwt.expiresIn,
    });

    await this.operationLogsService.create({
      userId: user._id.toString(),
      operationType: OperationType.LOGIN,
      module: 'auth',
      details: { email: user.email },
      ip: 'localhost',
    });

    return {
      accessToken: token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }

  async logout(userId: string) {
    await this.operationLogsService.create({
      userId,
      operationType: OperationType.LOGOUT,
      module: 'auth',
      details: {},
      ip: 'localhost',
    });
    return { message: '登出成功' };
  }
}
