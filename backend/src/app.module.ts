import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { CashierModule } from './modules/cashier/cashier.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { DictionaryModule } from './modules/dictionary/dictionary.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { OperationLogsModule } from './modules/operation-logs/operation-logs.module';
import { SettingsModule } from './modules/settings/settings.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/nail-salon'),
    RedisModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    TechniciansModule,
    AppointmentsModule,
    MembershipsModule,
    CheckinModule,
    CashierModule,
    RemindersModule,
    DictionaryModule,
    ScheduleModule,
    OperationLogsModule,
    SettingsModule,
  ],
})
export class AppModule {}
