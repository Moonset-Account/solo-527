import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { configuration } from './config/configuration';
import { RedisModule } from './shared/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { PartsModule } from './modules/parts/parts.module';
import { RulesModule } from './modules/rules/rules.module';
import { LeadsModule } from './modules/leads/leads.module';
import { FollowupsModule } from './modules/followups/followups.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { QualityModule } from './modules/quality/quality.module';
import { ExceptionsModule } from './modules/exceptions/exceptions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('mongoUri'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    AuthModule,
    VehiclesModule,
    TemplatesModule,
    PartsModule,
    RulesModule,
    LeadsModule,
    FollowupsModule,
    AppointmentsModule,
    QualityModule,
    ExceptionsModule,
    DashboardModule,
  ],
})
export class AppModule {}
