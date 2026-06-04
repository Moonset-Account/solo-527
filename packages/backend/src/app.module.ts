import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CustomerRequirementModule } from './modules/customer-requirement/customer-requirement.module';
import { QuoteModule } from './modules/quote/quote.module';
import { ContractModule } from './modules/contract/contract.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ProfitModule } from './modules/profit/profit.module';
import * as entities from './entities';
import { UserService } from './modules/user/user.service';
import { UserRole } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://travel:travel123@localhost:5432/travel_quote',
      entities: Object.values(entities),
      synchronize: true,
      logging: false,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    AuthModule,
    UserModule,
    CustomerRequirementModule,
    QuoteModule,
    ContractModule,
    NotificationModule,
    ProfitModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private userService: UserService) {}

  async onModuleInit() {
    await this.userService.initAdminUser();
    await this.initSampleUsers();
  }

  private async initSampleUsers() {
    try {
      const sampleUsers = [
        { username: 'sales01', password: '123456', name: '销售小张', email: 'sales01@travel.com', role: UserRole.SALES, department: '销售部' },
        { username: 'pm01', password: '123456', name: '产品经理小李', email: 'pm01@travel.com', role: UserRole.PRODUCT_MANAGER, department: '产品部' },
        { username: 'super01', password: '123456', name: '主管老王', email: 'super01@travel.com', role: UserRole.SUPERVISOR, department: '管理部' },
        { username: 'finance01', password: '123456', name: '财务小陈', email: 'finance01@travel.com', role: UserRole.FINANCE, department: '财务部' },
      ];

      for (const userData of sampleUsers) {
        const exists = await this.userService.findByUsername(userData.username);
        if (!exists) {
          await this.userService.create(userData);
          console.log(`Sample user created: ${userData.username}/123456`);
        }
      }
    } catch (e) {
      console.log('Sample users may exist already');
    }
  }
}
