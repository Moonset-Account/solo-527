import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentSlot } from './entities/appointment-slot.entity';
import { Appointment } from './entities/appointment.entity';
import { AppointmentSlotService } from './services/appointment-slot.service';
import { AppointmentService } from './services/appointment.service';
import { AppointmentSlotController } from './controllers/appointment-slot.controller';
import { AppointmentController } from './controllers/appointment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentSlot, Appointment])],
  controllers: [AppointmentSlotController, AppointmentController],
  providers: [AppointmentSlotService, AppointmentService],
  exports: [AppointmentSlotService, AppointmentService],
})
export class AppointmentModule {}
