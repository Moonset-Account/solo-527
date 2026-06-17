import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from '../../entities/appointment.entity';
import { User } from '../../entities/user.entity';
import { Counselor } from '../../entities/counselor.entity';
import { Service } from '../../entities/service.entity';
import { Schedule } from '../../entities/schedule.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';
import { WaitlistEntry } from '../../entities/waitlist-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, User, Counselor, Service, Schedule, ProcessingRecord, WaitlistEntry])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
