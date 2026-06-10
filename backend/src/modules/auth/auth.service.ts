import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './user.schema';
import { UserRole } from '../../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {
    this.initDefaultUsers();
  }

  async initDefaultUsers() {
    const count = await this.userModel.countDocuments();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await this.userModel.create([
        {
          username: 'admin',
          password: hashedPassword,
          name: '系统管理员',
          role: UserRole.ADMIN,
          phone: '13800000001',
        },
        {
          username: 'brand',
          password: hashedPassword,
          name: '品牌运营-小李',
          role: UserRole.BRAND_OPERATOR,
          phone: '13800000002',
        },
        {
          username: 'guide',
          password: hashedPassword,
          name: '门店导购-小王',
          role: UserRole.STORE_GUIDE,
          storeId: 'store001',
          storeName: '青禾美妆-南京路店',
          phone: '13800000003',
        },
      ]);
      console.log('✅ 默认用户已创建: admin/brand/guide, 密码均为 123456');
    }
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ username, active: true });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const { password: _, ...result } = user.toObject();
    return result;
  }

  async login(user: any) {
    const payload = {
      username: user.username,
      sub: user._id,
      role: user.role,
      name: user.name,
      storeId: user.storeId,
      storeName: user.storeName,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: payload,
    };
  }

  async findAll() {
    return this.userModel.find({}, { password: 0 }).sort({ createdAt: -1 });
  }

  async findById(id: string) {
    return this.userModel.findById(id, { password: 0 });
  }
}
