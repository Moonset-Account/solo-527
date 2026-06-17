import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { CommonModule } from './modules/common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { GuestsModule } from './modules/guests/guests.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { GapModule } from './modules/gap/gap.module';
import { ExceptionsModule } from './modules/exceptions/exceptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    RegistrationsModule,
    TicketsModule,
    SessionsModule,
    GuestsModule,
    CheckinModule,
    RefundsModule,
    NotificationsModule,
    AnalyticsModule,
    GapModule,
    ExceptionsModule,
  ],
})
export class AppModule {}
