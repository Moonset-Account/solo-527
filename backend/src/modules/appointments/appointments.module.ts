import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from '../../entities/appointment.entity';
import { OperationLog } from '../../entities/operation-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, OperationLog])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
