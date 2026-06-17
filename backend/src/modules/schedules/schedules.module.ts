import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from '../../entities/schedule.entity';
import { Counselor } from '../../entities/counselor.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Counselor, ProcessingRecord])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
