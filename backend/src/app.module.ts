import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { RedisModule } from './common/redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import { EmailDraftsModule } from './modules/email-drafts/email-drafts.module';
import { EmailVersionsModule } from './modules/email-versions/email-versions.module';
import { PromptTemplatesModule } from './modules/prompt-templates/prompt-templates.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { ReviewLogsModule } from './modules/review-logs/review-logs.module';
import { CallLogsModule } from './modules/call-logs/call-logs.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { StatisticsModule } from './modules/statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    UsersModule,
    EmailDraftsModule,
    EmailVersionsModule,
    PromptTemplatesModule,
    KnowledgeBaseModule,
    ReviewLogsModule,
    CallLogsModule,
    SystemSettingsModule,
    StatisticsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
