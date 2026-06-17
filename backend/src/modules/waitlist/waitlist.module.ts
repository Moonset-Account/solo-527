import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { WaitlistEntry } from '../../entities/waitlist-entry.entity';
import { Appointment } from '../../entities/appointment.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';
import { Counselor } from '../../entities/counselor.entity';
import { User } from '../../entities/user.entity';
import { Service } from '../../entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WaitlistEntry, Appointment, ProcessingRecord, Counselor, User, Service])],
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
