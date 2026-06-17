import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { MongoMemoryServer } from 'mongodb-memory-server';

import configuration from './config/configuration';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ReagentModule } from './modules/reagent/reagent.module';
import { ApplicationModule } from './modules/application/application.module';
import { InstrumentModule } from './modules/instrument/instrument.module';
import { HazardousModule } from './modules/hazardous/hazardous.module';
import { ProjectModule } from './modules/project/project.module';
import { SampleModule } from './modules/sample/sample.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditModule } from './modules/audit/audit.module';
import { DictionaryModule } from './modules/dictionary/dictionary.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

let mongoMemoryServer: MongoMemoryServer | null = null;

async function getMongoUri(configService: ConfigService): Promise<string> {
  const envUri = configService.get<string>('database.uri');
  if (envUri && !envUri.includes('localhost') && !envUri.includes('127.0.0.1')) {
    return envUri;
  }
  try {
    mongoMemoryServer = await MongoMemoryServer.create();
    return mongoMemoryServer.getUri();
  } catch {
    return envUri;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: await getMongoUri(configService),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    AuthModule,
    UsersModule,
    ReagentModule,
    ApplicationModule,
    InstrumentModule,
    HazardousModule,
    ProjectModule,
    SampleModule,
    NotificationModule,
    AuditModule,
    DictionaryModule,
    DashboardModule,
  ],
})
export class AppModule {}
