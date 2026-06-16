import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../../entities/appointment.entity.js';
import { Room } from '../../entities/room.entity.js';
import { ExceptionOrder } from '../../entities/exception-order.entity.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Room, ExceptionOrder])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
