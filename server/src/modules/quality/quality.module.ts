import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';
import { Quality, QualitySchema } from '../../schemas/quality.schema';
import { Appointment, AppointmentSchema } from '../../schemas/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quality.name, schema: QualitySchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
