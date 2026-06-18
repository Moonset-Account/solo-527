import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PetsModule } from './modules/pets/pets.module';
import { TrainingRecordsModule } from './modules/training-records/training-records.module';
import { AdoptionRecordsModule } from './modules/adoption-records/adoption-records.module';
import { HealthRecordsModule } from './modules/health-records/health-records.module';
import { FosterRecordsModule } from './modules/foster-records/foster-records.module';
import { OperationLogsModule } from './modules/operation-logs/operation-logs.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'pet_grooming',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UsersModule,
    ServicesModule,
    AppointmentsModule,
    PetsModule,
    TrainingRecordsModule,
    AdoptionRecordsModule,
    HealthRecordsModule,
    FosterRecordsModule,
    OperationLogsModule,
    ReportsModule,
    StatisticsModule,
  ],
})
export class AppModule {}
