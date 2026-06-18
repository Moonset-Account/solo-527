import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { AppointmentsModule } from '../appointments/appointments.module';
import { CounselorsModule } from '../counselors/counselors.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';

@Module({
  imports: [AppointmentsModule, CounselorsModule, OperationLogsModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
