import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckinRecordSchema } from './checkin.schema';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { AppointmentsModule } from '../appointments/appointments.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'CheckinRecord', schema: CheckinRecordSchema }]),
    AppointmentsModule,
    MembershipsModule,
  ],
  providers: [CheckinService],
  controllers: [CheckinController],
  exports: [CheckinService],
})
export class CheckinModule {}
