import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ApplicationsModule } from './applications/applications.module';
import { FaultsModule } from './faults/faults.module';
import { InspectionTemplatesModule } from './inspection-templates/inspection-templates.module';
import { InspectionTasksModule } from './inspection-tasks/inspection-tasks.module';
import { ChangeWindowsModule } from './change-windows/change-windows.module';
import { ProcessingRecordsModule } from './processing-records/processing-records.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    UsersModule,
    AuthModule,
    ApplicationsModule,
    FaultsModule,
    InspectionTemplatesModule,
    InspectionTasksModule,
    ChangeWindowsModule,
    ProcessingRecordsModule,
    AuditLogsModule,
    DashboardModule,
  ],
})
export class AppModule {}
