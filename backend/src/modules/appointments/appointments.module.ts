import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentSchema } from './appointment.schema';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { ServicesModule } from '../services/services.module';
import { TechniciansModule } from '../technicians/technicians.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Appointment', schema: AppointmentSchema }]),
    ServicesModule,
    TechniciansModule,
  ],
  providers: [AppointmentsService],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
