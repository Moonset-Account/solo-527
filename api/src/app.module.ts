import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { LeadsModule } from './modules/leads/leads.module.js';
import { FollowupsModule } from './modules/followups/followups.module.js';
import { PredictionsModule } from './modules/predictions/predictions.module.js';
import { ChurnModule } from './modules/churn/churn.module.js';
import { TagsModule } from './modules/tags/tags.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { RedisModule } from './common/redis.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/renovation-lead',
      }),
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    LeadsModule,
    FollowupsModule,
    PredictionsModule,
    ChurnModule,
    TagsModule,
    ReportsModule,
    SettingsModule,
  ],
})
export class AppModule {}
