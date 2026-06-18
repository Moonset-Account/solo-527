import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckIn } from './checkin.entity';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [TypeOrmModule.forFeature([CheckIn]), AppointmentsModule],
  providers: [CheckinsService],
  controllers: [CheckinsController],
  exports: [CheckinsService],
})
export class CheckinsModule {}
