import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './common/redis.module';
import { ActivityModule } from './modules/activity/activity.module';
import { ReportModule } from './modules/report/report.module';
import { RefundModule } from './modules/refund/refund.module';
import { ConfigModule } from './modules/config/config.module';
import { DownloadModule } from './modules/download/download.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: 'mongodb://localhost:27017/club-guarantee',
      }),
    }),
    RedisModule,
    ActivityModule,
    ReportModule,
    RefundModule,
    ConfigModule,
    DownloadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
