import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { databaseConfig, typeOrmConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ApiLoggingMiddleware } from './common/middleware/api-logging.middleware';
import { UserModule } from './modules/user/user.module';
import { LogModule } from './modules/log/log.module';
import { ClinicModule } from './modules/clinic/clinic.module';
import { PatientModule } from './modules/patient/patient.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { PrescriptionModule } from './modules/prescription/prescription.module';
import { ChargeModule } from './modules/charge/charge.module';
import { FollowUpModule } from './modules/followup/follow-up.module';
import { RevisitChurnModule } from './modules/revisit/revisit-churn.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    UserModule,
    LogModule,
    ClinicModule,
    PatientModule,
    DoctorModule,
    AppointmentModule,
    ReminderModule,
    PrescriptionModule,
    ChargeModule,
    FollowUpModule,
    RevisitChurnModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiLoggingMiddleware).forRoutes('*');
  }
}
