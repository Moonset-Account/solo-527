import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './modules/redis/redis.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AnomaliesModule } from './modules/anomalies/anomalies.module';
import { AlertRulesModule } from './modules/alert-rules/alert-rules.module';
import { DatasetsModule } from './modules/datasets/datasets.module';
import { BusinessDetailsModule } from './modules/business-details/business-details.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    AuthModule,
    UsersModule,
    AnomaliesModule,
    AlertRulesModule,
    DatasetsModule,
    BusinessDetailsModule,
    ReportsModule,
    NotificationsModule,
    DashboardModule,
    SearchModule,
  ],
})
export class AppModule {}
