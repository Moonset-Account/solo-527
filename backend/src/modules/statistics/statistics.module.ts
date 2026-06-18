import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Appointment } from '../../entities/appointment.entity';
import { FosterRecord } from '../../entities/foster-record.entity';
import { AdoptionRecord } from '../../entities/adoption-record.entity';
import { Service } from '../../entities/service.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';
import { OperationLog } from '../../entities/operation-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      FosterRecord,
      AdoptionRecord,
      Service,
      User,
      Pet,
      OperationLog,
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
