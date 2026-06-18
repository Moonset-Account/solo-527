import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { UserSchema } from '../users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule implements OnModuleInit {
  constructor(
    private readonly service: NotificationsService,
    @Inject(getModelToken(User.name)) private userModel: Model<User>,
  ) {}

  async onModuleInit() {
    const users = await this.userModel.find().select('_id');
    for (const u of users.slice(0, 2)) {
      await this.service.initMockData(u._id.toString());
    }
    console.log('✅ 通知模拟数据初始化完成');

    setTimeout(async () => {
      console.log('🔔 启动时执行权限过期检查...');
      await this.service.dailyCheckPermissionExpiry();
    }, 3000);
  }
}
