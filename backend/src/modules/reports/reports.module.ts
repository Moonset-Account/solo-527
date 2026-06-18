import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from '../../entities/report.entity';
import { OperationLog } from '../../entities/operation-log.entity';
import { Appointment } from '../../entities/appointment.entity';
import { FosterRecord } from '../../entities/foster-record.entity';
import { AdoptionRecord } from '../../entities/adoption-record.entity';
import { Service } from '../../entities/service.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';
import { StatisticsModule } from '../statistics/statistics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      OperationLog,
      Appointment,
      FosterRecord,
      AdoptionRecord,
      Service,
      User,
      Pet,
    ]),
    StatisticsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
