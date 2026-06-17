import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CounselorsModule } from './modules/counselors/counselors.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { ServicesModule } from './modules/services/services.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { WaitlistRulesModule } from './modules/waitlist-rules/waitlist-rules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'counseling_queue',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UsersModule,
    CounselorsModule,
    AppointmentsModule,
    WaitlistModule,
    ServicesModule,
    SchedulesModule,
    RefundsModule,
    StatisticsModule,
    WaitlistRulesModule,
  ],
})
export class AppModule {}
