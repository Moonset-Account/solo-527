import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema, UserStatus } from './user.schema';
import { Role } from '../common/decorators/roles.enum';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async onModuleInit() {
    const count = await this.userModel.countDocuments();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await this.userModel.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        realName: '系统管理员',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        phone: '13800000000',
      });
      await this.userModel.create({
        username: 'manager',
        email: 'manager@example.com',
        password: hashedPassword,
        realName: '物业经理',
        role: Role.MANAGER,
        status: UserStatus.ACTIVE,
        phone: '13800000001',
      });
      await this.userModel.create({
        username: 'cs01',
        email: 'cs01@example.com',
        password: hashedPassword,
        realName: '客服小王',
        role: Role.CUSTOMER_SERVICE,
        status: UserStatus.ACTIVE,
        phone: '13800000002',
      });
      console.log('默认账号已创建: admin/manager/cs01，密码均为 admin123');
    }
  }
}
