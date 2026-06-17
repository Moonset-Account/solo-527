import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { ProcessingRecord } from '../../entities/processing-record.entity';
import { Appointment } from '../../entities/appointment.entity';
import { Refund } from '../../entities/refund.entity';
import { WaitlistEntry } from '../../entities/waitlist-entry.entity';
import { User } from '../../entities/user.entity';
import { Counselor } from '../../entities/counselor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessingRecord, Appointment, Refund, WaitlistEntry, User, Counselor])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
