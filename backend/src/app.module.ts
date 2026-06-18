import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CounselorsModule } from './modules/counselors/counselors.module';
import { PackagesModule } from './modules/packages/packages.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { CheckinsModule } from './modules/checkins/checkins.module';
import { OperationLogsModule } from './modules/operation-logs/operation-logs.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsersModule,
    CounselorsModule,
    PackagesModule,
    AppointmentsModule,
    WaitlistModule,
    CheckinsModule,
    OperationLogsModule,
    StatisticsModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
